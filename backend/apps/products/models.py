"""
Product models for catalog management.
"""
from django.db import models
from django.core.validators import MinValueValidator
from apps.vendors.models import Vendor


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        help_text='Cover image for category'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model for items in catalog."""
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    shipping_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Shipping cost for this product"
    )
    image = models.ImageField(upload_to='products/')
    stock_quantity = models.PositiveIntegerField(default=0)
    # Stock management fields (WooCommerce-like)
    manage_stock = models.BooleanField(default=True)
    allow_backorders = models.BooleanField(default=False)
    low_stock_threshold = models.PositiveIntegerField(default=1)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]
    
    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Additional gallery images for a product."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.product.name} ({self.id})"


class ProductVariation(models.Model):
    """Represents a specific variation of a product (e.g., Size=M, Color=Red)."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    sku = models.CharField(max_length=100, blank=True, null=True)
    # Optional override price for this variation; if null, fall back to product.price
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    # Store attributes like {"size": "M", "color": "Red"}
    attributes = models.JSONField(default=dict)
    stock_quantity = models.PositiveIntegerField(default=0)
    manage_stock = models.BooleanField(default=True)
    allow_backorders = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['product', 'sku'])]

    def __str__(self):
        return f"{self.product.name} - {self.attributes}"


class VariationImage(models.Model):
    """Images specific to a product variation."""

    variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/variations/')
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Variation image for {self.variation.sku or self.variation.id}"


class ProductReview(models.Model):
    """Customer reviews and ratings for products."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=120)
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    is_verified_purchase = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Product Reviews'
        indexes = [models.Index(fields=['product', 'is_approved'])]
    
    def __str__(self):
        return f"Review by {self.customer_name} for {self.product.name} - {self.rating}★"
