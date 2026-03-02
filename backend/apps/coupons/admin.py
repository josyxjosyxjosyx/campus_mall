"""
Admin configuration for coupons.
"""
from django.contrib import admin
from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'vendor', 'discount_percentage', 'is_active', 'current_uses', 'max_uses', 'created_at')
    list_filter = ('is_active', 'vendor', 'created_at')
    search_fields = ('code', 'description')
    filter_horizontal = ('products',)
    readonly_fields = ('current_uses', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'vendor', 'description', 'is_active')
        }),
        ('Discount', {
            'fields': ('discount_percentage',)
        }),
        ('Products', {
            'fields': ('products',),
            'description': 'Leave empty to apply to all vendor products'
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'current_uses')
        }),
        ('Valid Period', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
