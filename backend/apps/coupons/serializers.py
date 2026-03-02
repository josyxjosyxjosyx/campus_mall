"""
Serializers for coupon data.
"""
from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for coupon data."""
    
    is_valid_now = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'description', 'discount_percentage',
            'products', 'max_uses', 'current_uses', 'is_active',
            'start_date', 'end_date', 'is_valid_now', 'product_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'current_uses', 'created_at', 'updated_at')
    
    def get_is_valid_now(self, obj):
        """Check if coupon is currently valid."""
        return obj.is_valid()
    
    def get_product_count(self, obj):
        """Get count of products this coupon applies to."""
        return obj.products.count()


class CouponDetailSerializer(CouponSerializer):
    """Detailed serializer with product information."""
    
    class Meta(CouponSerializer.Meta):
        fields = CouponSerializer.Meta.fields


class CouponCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating coupons."""
    
    class Meta:
        model = Coupon
        fields = (
            'code', 'description', 'discount_percentage',
            'products', 'max_uses', 'is_active',
            'start_date', 'end_date'
        )
    
    def validate_code(self, value):
        """Validate coupon code uniqueness."""
        request = self.context.get('request')
        instance = self.instance
        
        # Check if code is unique (excluding self on update)
        if Coupon.objects.filter(code=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A coupon with this code already exists.")
        
        return value.upper()
    
    def validate(self, data):
        """Validate coupon dates."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if end_date and start_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })
        
        return data

