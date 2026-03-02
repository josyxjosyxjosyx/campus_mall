"""
Order views for order management.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.vendors.models import Vendor
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusSerializer
from apps.products.models import Product, ProductVariation
from django.db import transaction


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for order management."""
    
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Order.objects.all()
        elif user.role == 'VENDOR':
            try:
                vendor = user.vendor_profile
                return Order.objects.filter(vendor=vendor)
            except:
                return Order.objects.none()
        elif user.role == 'CUSTOMER':
            return Order.objects.filter(customer=user)
        
        return Order.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create a new order."""
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                vendor = Vendor.objects.get(id=serializer.validated_data['vendor_id'])
            except Vendor.DoesNotExist:
                return Response(
                    {'error': 'Vendor not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Wrap in a DB transaction to ensure atomicity (create order, items, and decrement stock)
            try:
                with transaction.atomic():
                    payment_method = serializer.validated_data['payment_method']
                    order = Order.objects.create(
                        customer=request.user,
                        vendor=vendor,
                        total_amount=serializer.validated_data['total_amount'],
                        payment_method=payment_method,
                        shipping_address=serializer.validated_data['shipping_address']
                    )

                    # Create order items and validate/decrement stock
                    for item in serializer.validated_data['items']:
                        try:
                            product_id = int(item.get('productId', 0))
                            variation_id = item.get('variationId')
                            quantity = int(item.get('quantity', 1))
                            price = float(item.get('price', 0))

                            # Lock product row for update to avoid race conditions
                            product = Product.objects.select_for_update().get(id=product_id)

                            # Check vendor ownership
                            if product.vendor != vendor:
                                raise ValueError('Product does not belong to the selected vendor')

                            # Handle variation stock if variation is provided
                            variation = None
                            if variation_id:
                                try:
                                    variation = ProductVariation.objects.select_for_update().get(id=variation_id, product=product)
                                    # Check variation stock
                                    if variation.manage_stock:
                                        if variation.stock_quantity < quantity and not variation.allow_backorders:
                                            raise ValueError(f'Insufficient stock for {product.name} ({variation.sku or "variant"})')
                                except ProductVariation.DoesNotExist:
                                    raise ValueError(f'Product variation not found')
                            else:
                                # Check product stock if no variation
                                if product.manage_stock:
                                    if product.stock_quantity < quantity and not product.allow_backorders:
                                        raise ValueError(f'Insufficient stock for product {product.name}')

                            # Create order item
                            OrderItem.objects.create(
                                order=order,
                                product=product,
                                variation=variation,
                                quantity=quantity,
                                price=price
                            )

                            # Decrement stock based on whether variation exists
                            if variation:
                                # Decrement variation stock if managed
                                if variation.manage_stock:
                                    variation.stock_quantity = max(0, variation.stock_quantity - quantity)
                                    # Mark inactive when out of stock
                                    if variation.stock_quantity == 0:
                                        variation.is_active = False
                                    variation.save()
                            else:
                                # Decrement product stock if managed
                                if product.manage_stock:
                                    product.stock_quantity = max(0, product.stock_quantity - quantity)
                                    # Optionally mark inactive when out of stock
                                    if product.stock_quantity == 0:
                                        product.is_active = False
                                    product.save()

                        except (ValueError, TypeError) as e:
                            raise
                        except Product.DoesNotExist:
                            raise ValueError('Product not found')

                    # Gateway payments are confirmed asynchronously.
                    if payment_method in ('STRIPE', 'PAYSTACK'):
                        order.payment_status = 'PENDING'
                        order.status = 'PENDING'
                    else:
                        order.payment_status = 'COMPLETED'
                        order.status = 'CONFIRMED'
                    order.save()

                    response_serializer = OrderSerializer(order)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': f'Failed to create order: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'])
    def update_status(self, request, pk=None):
        """Update order status."""
        order = self.get_object()
        
        # Check permissions
        if request.user.role == 'VENDOR' and order.vendor.user != request.user:
            return Response(
                {'error': 'You can only update your own vendor orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.role == 'CUSTOMER' and order.customer != request.user:
            return Response(
                {'error': 'You can only view your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = OrderStatusSerializer(data=request.data)
        if serializer.is_valid():
            # Customers should not be able to alter payment lifecycle.
            if request.user.role == 'CUSTOMER' and 'payment_status' in serializer.validated_data:
                return Response(
                    {'error': 'Customers cannot update payment status'},
                    status=status.HTTP_403_FORBIDDEN
                )
            order.status = serializer.validated_data['status']
            if 'payment_status' in serializer.validated_data and serializer.validated_data['payment_status']:
                order.payment_status = serializer.validated_data['payment_status']
            order.save()
            response_serializer = OrderSerializer(order)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get current user's orders."""
        orders = self.get_queryset()
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def filter_by_status(self, request):
        """Filter orders by status."""
        status_param = request.query_params.get('status')
        if not status_param:
            return Response(
                {'error': 'status parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        orders = self.get_queryset().filter(status=status_param)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
