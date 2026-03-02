"""
Django admin configuration for products.
"""
from django.contrib import admin
from .models import Product, Category, ProductReview


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model."""
    
    list_display = ('name', 'slug', 'parent')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product model."""
    
    list_display = ('name', 'vendor', 'category', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at')
    list_filter = ('is_active', 'category', 'created_at')
    search_fields = ('name', 'vendor__store_name')
    readonly_fields = ('created_at', 'updated_at', 'rating')
    fieldsets = (
        ('Product Information', {
            'fields': ('name', 'description', 'category', 'vendor')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock_quantity')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status & Metrics', {
            'fields': ('is_active', 'is_featured', 'rating')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """Admin interface for ProductReview model."""
    
    list_display = ('customer_name', 'product', 'rating', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'is_verified_purchase', 'created_at')
    search_fields = ('customer_name', 'customer_email', 'product__name', 'title')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Review Content', {
            'fields': ('product', 'customer_name', 'customer_email', 'rating', 'title', 'content')
        }),
        ('Status', {
            'fields': ('is_approved', 'is_verified_purchase')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
