"""
Payment gateway views: Stripe and Paystack.
"""
import json
import decimal
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.vendors.models import Vendor
from apps.orders.models import Order, OrderItem
from apps.products.models import Product, ProductVariation
from django.db import transaction


def _create_pending_orders(request, orders_payload, payment_method="STRIPE"):
    """Create orders in PENDING state; return (list of orders, total_amount_sum) or (None, error_response)."""
    created = []
    total = decimal.Decimal("0.00")
    for payload in orders_payload:
        vendor_id = payload.get("vendor_id")
        total_amount = decimal.Decimal(str(payload["total_amount"]))
        shipping_address = payload.get("shipping_address", "")
        items = payload.get("items", [])
        pm = payload.get("payment_method") or payment_method
        if not items:
            for o in created:
                o.delete()
            return None, Response(
                {"error": "Each order must have at least one item"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            for o in created:
                o.delete()
            return None, Response(
                {"error": f"Vendor {vendor_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        order = Order.objects.create(
            customer=request.user,
            vendor=vendor,
            total_amount=total_amount,
            payment_method=pm,
            shipping_address=shipping_address,
            status="PENDING",
            payment_status="PENDING",
        )
        for item in items:
            product_id = int(item.get("productId", 0))
            variation_id = item.get("variationId")
            OrderItem.objects.create(
                order=order,
                product_id=product_id,
                variation_id=variation_id,
                quantity=int(item.get("quantity", 1)),
                price=float(item.get("price", 0)),
            )
        created.append(order)
        total += total_amount
    return created, total


def _confirm_and_decrement(orders_queryset):
    """Confirm orders and decrement stock for their items safely under a DB transaction."""
    with transaction.atomic():
        orders = list(orders_queryset.select_for_update())
        for order in orders:
            # If already completed, skip
            if order.payment_status == 'COMPLETED' and order.status == 'CONFIRMED':
                continue
            items = OrderItem.objects.filter(order=order)
            for item in items:
                try:
                    product = Product.objects.select_for_update().get(id=item.product_id)
                except Product.DoesNotExist:
                    continue

                variation = None
                variation_id = getattr(item, 'variation_id', None)
                if variation_id:
                    try:
                        variation = ProductVariation.objects.select_for_update().get(id=variation_id, product=product)
                    except ProductVariation.DoesNotExist:
                        variation = None

                qty = int(item.quantity or 0)
                if variation and getattr(variation, 'manage_stock', False):
                    variation.stock_quantity = max(0, variation.stock_quantity - qty)
                    if variation.stock_quantity == 0:
                        variation.is_active = False
                    variation.save()
                else:
                    if getattr(product, 'manage_stock', False):
                        product.stock_quantity = max(0, product.stock_quantity - qty)
                        if product.stock_quantity == 0:
                            product.is_active = False
                        product.save()

            order.payment_status = 'COMPLETED'
            order.status = 'CONFIRMED'
            order.save()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stripe_create_intent(request):
    """
    Create pending orders and a Stripe PaymentIntent.
    Body: { "customer_email": "...", "orders": [ { "vendor_id", "total_amount", "shipping_address", "items" }, ... ] }
    Returns: { "client_secret", "order_ids", "stripe_publishable_key" }
    """
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
    if not stripe_secret:
        return Response(
            {"error": "Stripe is not configured (STRIPE_SECRET_KEY missing)"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    try:
        import stripe
        stripe.api_key = stripe_secret
    except ImportError:
        return Response(
            {"error": "Stripe package not installed. pip install stripe"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    data = request.data
    orders_payload = data.get("orders") or []
    if not orders_payload:
        return Response(
            {"error": "orders array is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    created, total_amount = _create_pending_orders(request, orders_payload, payment_method="STRIPE")
    if created is None:
        return total_amount  # error Response
    total_cents = int((total_amount * 100).to_integral_value())
    if total_cents < 50:  # Stripe minimum
        for o in created:
            o.delete()
        return Response(
            {"error": "Total amount must be at least $0.50"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    order_ids = [str(o.id) for o in created]
    try:
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency="usd",
            automatic_payment_methods={"enabled": True},
            metadata={"order_ids": ",".join(order_ids)},
            receipt_email=data.get("customer_email") or request.user.email,
        )
    except Exception as e:
        for o in created:
            o.delete()
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    for o in created:
        o.payment_reference = intent.id
        o.save(update_fields=["payment_reference"])
    publishable = getattr(settings, "STRIPE_PUBLISHABLE_KEY", "") or ""
    return Response({
        "client_secret": intent.client_secret,
        "order_ids": order_ids,
        "stripe_publishable_key": publishable,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def paystack_initialize(request):
    """
    Create pending orders and initialize a Paystack transaction.
    Body: { "customer_email": "...", "orders": [ ... ], "callback_url": "https://..." }
    Returns: { "authorization_url", "access_code", "reference", "order_ids" }
    """
    paystack_secret = getattr(settings, "PAYSTACK_SECRET_KEY", None)
    if not paystack_secret:
        return Response(
            {"error": "Paystack is not configured (PAYSTACK_SECRET_KEY missing)"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    try:
        import requests
    except ImportError:
        return Response(
            {"error": "requests package not installed. pip install requests"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    data = request.data
    orders_payload = data.get("orders") or []
    if not orders_payload:
        return Response(
            {"error": "orders array is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    created, total_amount = _create_pending_orders(request, orders_payload, payment_method="PAYSTACK")
    if created is None:
        return total_amount
    # Paystack amount in smallest currency unit (kobo for NGN, cents for USD)
    amount_kobo = int((total_amount * 100).to_integral_value())
    if amount_kobo < 100:
        for o in created:
            o.delete()
        return Response(
            {"error": "Total amount must be at least 1.00 (NGN or USD)"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    email = data.get("customer_email") or request.user.email
    callback_url = data.get("callback_url") or ""
    # Use first order id as reference so we can look up all orders by it (we'll store same ref in all)
    reference = str(created[0].id) if created else ""
    payload = {
        "email": email,
        "amount": amount_kobo,
        "reference": reference,
        "callback_url": callback_url,
        "metadata": {"order_ids": ",".join(str(o.id) for o in created)},
        "currency": getattr(settings, "PAYSTACK_CURRENCY", "NGN"),
    }
    resp = requests.post(
        "https://api.paystack.co/transaction/initialize",
        json=payload,
        headers={
            "Authorization": f"Bearer {paystack_secret}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    if resp.status_code != 200:
        for o in created:
            o.delete()
        try:
            err = resp.json()
            msg = err.get("message", resp.text)
        except Exception:
            msg = resp.text
        return Response(
            {"error": msg or "Paystack initialization failed"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    result = resp.json()
    data_obj = result.get("data", {})
    authorization_url = data_obj.get("authorization_url", "")
    access_code = data_obj.get("access_code", "")
    ref_from_paystack = data_obj.get("reference", reference)
    for o in created:
        o.payment_reference = ref_from_paystack
        o.save(update_fields=["payment_reference"])
    return Response({
        "authorization_url": authorization_url,
        "access_code": access_code,
        "reference": ref_from_paystack,
        "order_ids": [str(o.id) for o in created],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def paystack_verify(request):
    """
    Verify a Paystack transaction by reference and confirm orders.
    POST body or query: reference=...
    """
    paystack_secret = getattr(settings, "PAYSTACK_SECRET_KEY", None)
    if not paystack_secret:
        return Response(
            {"error": "Paystack is not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    try:
        import requests
    except ImportError:
        return Response(
            {"error": "requests package not installed"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    reference = request.data.get("reference") or request.query_params.get("reference")
    if not reference:
        return Response(
            {"error": "reference is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    resp = requests.get(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {paystack_secret}"},
        timeout=10,
    )
    if resp.status_code != 200:
        try:
            err = resp.json()
            msg = err.get("message", resp.text)
        except Exception:
            msg = resp.text
        return Response(
            {"error": msg or "Verification failed"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    result = resp.json()
    data_obj = result.get("data", {})
    if data_obj.get("status") != "success":
        return Response(
            {"error": "Payment was not successful"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    # Find orders with this payment_reference (all orders from this payment)
    orders = Order.objects.filter(
        payment_reference=reference,
        customer=request.user,
        payment_status="PENDING",
    )
    if not orders.exists():
        return Response(
            {"error": "No pending orders found for this payment", "verified": False},
            status=status.HTTP_404_NOT_FOUND,
        )
    # Confirm and decrement stock safely
    try:
        _confirm_and_decrement(orders)
    except Exception as e:
        return Response({"error": f"Failed to confirm orders: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({
        "verified": True,
        "message": "Payment verified and orders confirmed",
        "order_ids": [str(o.id) for o in orders],
    })


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Stripe webhook: on payment_intent.succeeded, confirm orders."""
    stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
    webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)
    if not stripe_secret:
        return HttpResponse("Stripe not configured", status=503)
    try:
        import stripe
        stripe.api_key = stripe_secret
    except ImportError:
        return HttpResponse("Stripe not installed", status=503)
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = json.loads(payload)
    except (ValueError, Exception):
        return HttpResponse("Invalid payload or signature", status=400)
    if event.get("type") == "payment_intent.succeeded":
        pi = event.get("data", {}).get("object", {})
        payment_intent_id = pi.get("id")
        order_ids_str = (pi.get("metadata") or {}).get("order_ids", "")
        if payment_intent_id and order_ids_str:
            order_ids = [x.strip() for x in order_ids_str.split(",") if x.strip()]
            orders = Order.objects.filter(
                id__in=order_ids,
                payment_reference=payment_intent_id,
                payment_status="PENDING",
            )
            if orders.exists():
                try:
                    _confirm_and_decrement(orders)
                except Exception:
                    # swallow to avoid webhook retries causing problems; log in real app
                    pass
    return HttpResponse(status=200)
