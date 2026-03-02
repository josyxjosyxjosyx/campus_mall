#!/usr/bin/env python
"""
Debug order creation to see exact error
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.products.models import Product
from apps.vendors.models import Vendor
from apps.users.models import User

print("=" * 70)
print("DEBUGGING ORDER CREATION ISSUE")
print("=" * 70)

# Check if product exists
print("\n1. Checking product with name 'ttt':")
try:
    product = Product.objects.get(name='ttt')
    print(f"✓ Product found: {product.name} (ID: {product.id})")
    print(f"  - Vendor: {product.vendor.id if product.vendor else 'NONE'}")
    print(f"  - Price: {product.price}")
    print(f"  - Stock: {product.stock_quantity}")
    print(f"  - Active: {product.is_active}")
    print(f"  - Featured: {product.is_featured}")
except Product.DoesNotExist:
    print("✗ Product 'ttt' not found!")
    print("\nAll products:")
    for p in Product.objects.all()[:5]:
        print(f"  - {p.id}: {p.name} (vendor: {p.vendor.id if p.vendor else 'NONE'})")

# Check vendor
print("\n2. Checking vendor 1:")
try:
    vendor = Vendor.objects.get(id=1)
    print(f"✓ Vendor found: {vendor.store_name} (ID: {vendor.id})")
except Vendor.DoesNotExist:
    print("✗ Vendor 1 not found!")

# Check OrderItem model constraints
print("\n3. Checking OrderItem model:")
from apps.orders.models import OrderItem
print(f"OrderItem fields:")
for field in OrderItem._meta.get_fields():
    print(f"  - {field.name}: {field.get_internal_type()}")
