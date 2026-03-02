"""
Django admin configuration for orders.
"""
from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline admin for order items."""
    model = OrderItem
    extra = 0
    readonly_fields = ('price',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin interface for Order model."""
    
    list_display = ('id', 'customer', 'vendor', 'total_amount', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('id', 'customer__email', 'vendor__store_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'customer', 'vendor')
        }),
        ('Amounts', {
            'fields': ('total_amount',)
        }),
        ('Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Payment & Shipping', {
            'fields': ('payment_method', 'shipping_address')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
