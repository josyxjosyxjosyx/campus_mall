"""
Django admin configuration for users.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    
    list_display = ('email', 'first_name', 'role', 'is_active', 'is_approved', 'created_at')
    list_filter = ('role', 'is_active', 'is_approved', 'created_at')
    search_fields = ('email', 'first_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'is_approved')}),
    )
