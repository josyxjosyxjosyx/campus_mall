"""
Django admin configuration for vendors.
"""
from django.contrib import admin
from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    """Admin interface for Vendor model."""
    
    list_display = ('store_name', 'user', 'selling_category', 'is_approved', 'is_suspended', 'rating', 'created_at')
    list_filter = ('is_approved', 'is_suspended', 'created_at')
    search_fields = ('store_name', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'rating')
    fieldsets = (
        ('Store Information', {
            'fields': ('user', 'store_name', 'description', 'phone', 'address', 'selling_category', 'logo')
        }),
        ('Status', {
            'fields': ('is_approved', 'is_suspended')
        }),
        ('Metrics', {
            'fields': ('rating',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
