#!/usr/bin/env python
"""
Test actual order creation API endpoint
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.users.models import User

print("=" * 60)
print("Testing Order Creation API Endpoint")
print("=" * 60)

# Get a customer user and their token
customer = User.objects.filter(role='CUSTOMER').first()
if not customer:
    print("✗ No customer user found")
    sys.exit(1)

print(f"\n1. Using customer: {customer.email} (ID: {customer.id})")

# Generate a token for the customer
from rest_framework_simplejwt.tokens import RefreshToken

refresh = RefreshToken.for_user(customer)
access_token = str(refresh.access_token)
print(f"✓ Generated token: {access_token[:20]}...")

# Prepare the order data
order_data = {
    'vendor_id': 1,
    'total_amount': '33.00',
    'payment_method': 'CREDIT_CARD',
    'shipping_address': '123 Main St, City, Country 12345',
    'items': [
        {'productId': 15, 'quantity': 1, 'price': 33}
    ]
}

print(f"\n2. Order data:")
print(json.dumps(order_data, indent=2, default=str))

# Make the request
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json',
}

response = requests.post(
    'http://localhost:8000/api/orders/',
    json=order_data,
    headers=headers
)

print(f"\n3. API Response:")
print(f"Status Code: {response.status_code}")

try:
    response_data = response.json()
    print(f"Response Body:")
    print(json.dumps(response_data, indent=2, default=str))
except:
    print(f"Response Text:")
    print(response.text)

# Check the database
from apps.orders.models import Order

print(f"\n4. Orders in database:")
orders = Order.objects.all()
print(f"Total orders: {orders.count()}")
for order in orders:
    print(f"  - Order #{order.id}: Customer {order.customer.email}, Vendor {order.vendor.store_name}, Status {order.status}")

print("\n" + "=" * 60)
