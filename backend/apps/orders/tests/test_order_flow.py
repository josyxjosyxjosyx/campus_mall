from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderItem
from apps.products.models import Category, Product, ProductVariation
from apps.vendors.models import Vendor

User = get_user_model()


class OrderFlowTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@test.com",
            password="pass12345",
            role="CUSTOMER",
        )
        self.vendor_user = User.objects.create_user(
            username="vendor",
            email="vendor@test.com",
            password="pass12345",
            role="VENDOR",
            is_approved=True,
        )
        self.vendor = Vendor.objects.create(
            user=self.vendor_user,
            store_name="Vendor Test Store",
            is_approved=True,
        )
        self.category = Category.objects.create(name="Electronics", slug="electronics")
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            name="Headphones",
            description="Wireless",
            price=Decimal("100.00"),
            image="products/test.jpg",
            stock_quantity=10,
            is_active=True,
        )
        self.variation = ProductVariation.objects.create(
            product=self.product,
            sku="HP-BLACK",
            attributes={"color": "black"},
            stock_quantity=5,
            is_active=True,
        )

    def test_gateway_orders_stay_pending_and_persist_variation(self):
        self.client.force_authenticate(user=self.customer)
        payload = {
            "vendor_id": self.vendor.id,
            "total_amount": "100.00",
            "payment_method": "STRIPE",
            "shipping_address": "123 Main St",
            "items": [
                {
                    "productId": self.product.id,
                    "variationId": self.variation.id,
                    "quantity": 1,
                    "price": 100.0,
                }
            ],
        }

        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(id=response.data["id"])
        self.assertEqual(order.payment_status, "PENDING")
        self.assertEqual(order.status, "PENDING")
        item = OrderItem.objects.get(order=order)
        self.assertEqual(item.variation_id, self.variation.id)

    def test_non_gateway_orders_complete_immediately(self):
        self.client.force_authenticate(user=self.customer)
        payload = {
            "vendor_id": self.vendor.id,
            "total_amount": "100.00",
            "payment_method": "CREDIT_CARD",
            "shipping_address": "123 Main St",
            "items": [
                {
                    "productId": self.product.id,
                    "quantity": 1,
                    "price": 100.0,
                }
            ],
        }

        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(id=response.data["id"])
        self.assertEqual(order.payment_status, "COMPLETED")
        self.assertEqual(order.status, "CONFIRMED")

    def test_vendor_can_update_status_for_completed_order(self):
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            total_amount=Decimal("100.00"),
            payment_method="CREDIT_CARD",
            shipping_address="123 Main St",
            payment_status="COMPLETED",
            status="CONFIRMED",
        )
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.put(
            f"/api/orders/{order.id}/update_status/",
            {"status": "SHIPPED"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, "SHIPPED")
