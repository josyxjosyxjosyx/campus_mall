"""
Serializers for product data.
"""
from rest_framework import serializers
from .models import Product, Category
from .models import ProductImage, ProductVariation, VariationImage, ProductReview
from .models import WishlistItem


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for category data."""
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'image')


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for product data."""
    
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Product
        fields = (
            'id', 'vendor', 'vendor_name', 'category', 'category_name',
            'name', 'description', 'price', 'shipping_fee', 'image', 'stock_quantity',
            'images', 'variations',
            'rating', 'is_active', 'is_featured', 'created_at', 'updated_at',
            'manage_stock', 'allow_backorders', 'low_stock_threshold'
        )
        read_only_fields = ('id', 'rating', 'created_at', 'updated_at', 'vendor')
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
            'description': {'required': False}
        }


class ProductDetailSerializer(ProductSerializer):
    """Detailed serializer for product information."""
    
    vendor_details = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ('vendor_details', 'reviews')
    
    def get_vendor_details(self, obj):
        return {
            'id': obj.vendor.id,
            'name': obj.vendor.store_name,
            'rating': str(obj.vendor.rating),
        }


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'order')


class VariationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariationImage
        fields = ('id', 'image', 'alt_text', 'order')


class ProductVariationSerializer(serializers.ModelSerializer):
    images = VariationImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariation
        fields = (
            'id', 'sku', 'price', 'attributes', 'stock_quantity',
            'manage_stock', 'allow_backorders', 'is_active', 'created_at', 'images'
        )


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews."""
    
    class Meta:
        model = ProductReview
        fields = (
            'id', 'product', 'customer_email', 'customer_name', 'rating',
            'title', 'content', 'is_verified_purchase', 'is_approved', 'created_at'
        )
        read_only_fields = ('id', 'is_verified_purchase', 'is_approved', 'created_at')


# Extend ProductSerializer to show images and variations for read operations
ProductSerializer._declared_fields['images'] = ProductImageSerializer(many=True, read_only=True)
ProductSerializer._declared_fields['variations'] = ProductVariationSerializer(many=True, read_only=True)
ProductDetailSerializer._declared_fields['images'] = ProductImageSerializer(many=True, read_only=True)
ProductDetailSerializer._declared_fields['variations'] = ProductVariationSerializer(many=True, read_only=True)
ProductDetailSerializer._declared_fields['reviews'] = ProductReviewSerializer(many=True, read_only=True)


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'user', 'product', 'product_id', 'created_at')
        read_only_fields = ('id', 'user', 'product', 'created_at')
