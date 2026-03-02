"""
Coupon models for discount management.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.vendors.models import Vendor
from apps.products.models import Product
from datetime import timedelta
from django.utils import timezone


class Coupon(models.Model):
    """Coupon model for vendor discounts."""
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_percentage = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount percentage (0-100)"
    )
    # Coupon can be applied to specific products or all products
    products = models.ManyToManyField(
        Product,
        related_name='coupons',
        blank=True,
        help_text="Leave empty to apply to all products from this vendor"
    )
    # Usage limits
    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of times coupon can be used (null = unlimited)"
    )
    current_uses = models.PositiveIntegerField(default=0)
    # Date range
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Leave empty for no expiration"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['vendor', 'is_active'])]
    
    def __str__(self):
        return f"{self.code} - {self.discount_percentage}% off"
    
    def is_valid(self):
        """Check if coupon is currently valid."""
        if not self.is_active:
            return False
        
        now = timezone.now()
        if now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
        
        return True
    
    def can_apply_to_product(self, product):
        """Check if coupon applies to a specific product."""
        # If no specific products are selected, applies to all vendor products
        if not self.products.exists():
            return product.vendor_id == self.vendor_id
        
        # Otherwise, check if product is in the coupon's product list
        return self.products.filter(id=product.id).exists()
