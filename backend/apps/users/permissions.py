"""
Custom permissions for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Permission for Admin role."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsVendor(BasePermission):
    """Permission for Vendor role."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'VENDOR'


class IsCustomer(BasePermission):
    """Permission for Customer role."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER'


class IsVendorOrReadOnly(BasePermission):
    """
    Permission for vendors to edit their own products,
    or allow read-only access for everyone.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        
        # Write permissions only for vendor
        return obj.vendor.user == request.user


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission for owners to edit their own data,
    or allow read-only access.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        
        return obj.user == request.user or request.user.role == 'ADMIN'
