"""
User models for authentication and authorization.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access control."""
    
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('VENDOR', 'Vendor'),
        ('CUSTOMER', 'Customer'),
    )
    
    CURRENCY_CHOICES = (
        ('USD', 'US Dollar'),
        ('GBP', 'British Pound'),
        ('SLE', 'Sierra Leonean Leone'),
    )
    
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='CUSTOMER'
    )
    preferred_currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='USD',
        help_text='Preferred currency for displaying prices'
    )
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.role})"


class Address(models.Model):
    """Saved addresses for customers."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(
        max_length=50,
        default='Home',
        help_text='Label for this address (e.g., Home, Work, Office)'
    )
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    email = models.EmailField(default='')
    phone_number = models.CharField(max_length=20, default='')
    address_line1 = models.CharField(max_length=255, verbose_name="Address Line 1", default='')
    address_line2 = models.CharField(max_length=255, blank=True, null=True, verbose_name="Address Line 2")
    city = models.CharField(max_length=100, default='')
    state = models.CharField(max_length=100, default='')
    postal_code = models.CharField(max_length=20, verbose_name="Zip Code", default='')
    country = models.CharField(max_length=100, default='')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'label')
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.label} - {self.first_name} {self.last_name}"
