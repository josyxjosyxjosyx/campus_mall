#!/usr/bin/env python
"""
Test script to verify order creation flow works correctly.
Run this from the backend directory: python test_order_creation.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.orders.serializers import OrderCreateSerializer
from apps.products.models import Product
from apps.vendors.models import Vendor
from apps.users.models import User

print("=" * 60)
print("Order Creation Test")
print("=" * 60)

# Test 1: Validate OrderCreateSerializer with order data
print("\n1. Testing OrderCreateSerializer validation:")
print("-" * 60)

test_data = {
    'vendor_id': 1,
    'total_amount': '33.00',
    'payment_method': 'CREDIT_CARD',
    'shipping_address': '123 Main St, City, Country 12345',
    'items': [
        {'productId': 15, 'quantity': 1, 'price': 33}
    ]
}

serializer = OrderCreateSerializer(data=test_data)
if serializer.is_valid():
    print("✓ Serializer is VALID")
    print(f"Validated data: {serializer.validated_data}")
else:
    print("✗ Serializer is INVALID")
    print(f"Errors: {serializer.errors}")

# Test 2: Check if vendor exists
print("\n2. Checking vendor existence:")
print("-" * 60)

try:
    vendor = Vendor.objects.get(id=1)
    print(f"✓ Vendor found: {vendor.store_name} (ID: {vendor.id})")
except Vendor.DoesNotExist:
    print("✗ Vendor ID 1 not found")

# Test 3: Check if product exists
print("\n3. Checking product existence:")
print("-" * 60)

try:
    product = Product.objects.get(id=15)
    print(f"✓ Product found: {product.name} (ID: {product.id}, Vendor: {product.vendor.id})")
    print(f"  Stock: {product.stock_quantity}, Price: {product.price}, Active: {product.is_active}")
except Product.DoesNotExist:
    print("✗ Product ID 15 not found")

# Test 4: Check if customer user exists
print("\n4. Checking customer users:")
print("-" * 60)

from django.db.models import Q
customers = User.objects.filter(role='CUSTOMER')
print(f"Found {customers.count()} customer(s)")
for customer in customers:
    print(f"  - {customer.email} (ID: {customer.id})")

print("\n" + "=" * 60)
print("Test Summary Complete")
print("=" * 60)
