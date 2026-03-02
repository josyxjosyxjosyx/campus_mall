"""
Serializers for order data.
"""
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    variation = serializers.IntegerField(source='variation.id', read_only=True)
    variation_sku = serializers.CharField(source='variation.sku', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'variation', 'variation_sku', 'quantity', 'price')


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order data."""
    
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'customer_email', 'vendor', 'vendor_name',
            'total_amount', 'status', 'payment_method', 'payment_status',
            'shipping_address', 'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders."""
    
    vendor_id = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    shipping_address = serializers.CharField()
    items = serializers.ListField(
        child=serializers.DictField()  # Allow any value types (not just strings)
    )
    
    def validate_items(self, value):
        """Validate items array has required fields."""
        if not value:
            raise serializers.ValidationError('Order must contain at least one item')
        
        for i, item in enumerate(value):
            if 'productId' not in item:
                raise serializers.ValidationError(f'Item {i} missing productId')
            if 'quantity' not in item:
                raise serializers.ValidationError(f'Item {i} missing quantity')
            if 'price' not in item:
                raise serializers.ValidationError(f'Item {i} missing price')
            
            # Validate types
            try:
                int(item['productId'])
                int(item['quantity'])
                float(item['price'])
            except (ValueError, TypeError):
                raise serializers.ValidationError(f'Item {i} has invalid type values')
        
        return value


class OrderStatusSerializer(serializers.Serializer):
    """Serializer for updating order status."""
    
    status = serializers.CharField()
    payment_status = serializers.CharField(required=False, allow_null=True)
    
    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Order.ORDER_STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f'Invalid status. Must be one of {valid_statuses}')
        return value
    
    def validate_payment_status(self, value):
        if value:
            valid_statuses = [choice[0] for choice in Order.PAYMENT_STATUS_CHOICES]
            if value not in valid_statuses:
                raise serializers.ValidationError(f'Invalid payment status. Must be one of {valid_statuses}')
        return value
