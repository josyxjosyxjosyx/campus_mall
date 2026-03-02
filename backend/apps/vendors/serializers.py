"""
Serializers for vendor data.
"""
from rest_framework import serializers
from .models import Vendor
from apps.products.models import Category


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for vendor data."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    selling_category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    selling_category_name = serializers.CharField(source='selling_category.name', read_only=True)
    
    class Meta:
        model = Vendor
        fields = (
            'id', 'user', 'user_email', 'user_name', 'store_name',
            'description', 'phone', 'address', 'logo',
            'selling_category', 'selling_category_name',
            'rating', 'is_approved',
            'is_suspended', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'rating', 'is_approved', 'is_suspended')


class VendorDetailSerializer(VendorSerializer):
    """Detailed serializer for vendor information."""
    
    product_count = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    
    class Meta(VendorSerializer.Meta):
        fields = VendorSerializer.Meta.fields + ('product_count', 'total_orders')
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    
    def get_total_orders(self, obj):
        return obj.vendor_orders.count()
