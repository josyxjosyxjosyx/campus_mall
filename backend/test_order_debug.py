#!/usr/bin/env python
"""
Test actual order creation API endpoint with detailed error capture
"""
import os
import sys
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

print("=" * 70)
print("Testing Order Creation with Detailed Error Capture")
print("=" * 70)

# Get customer user and token
customer = User.objects.filter(role='CUSTOMER').first()
if not customer:
    print("✗ No customer user found")
    sys.exit(1)

print(f"\n1. Customer: {customer.email}")

refresh = RefreshToken.for_user(customer)
access_token = str(refresh.access_token)

# Prepare order data - exact same as what Checkout.tsx would send
order_data = {
    'vendor_id': 1,
    'total_amount': '33.00',
    'payment_method': 'CREDIT_CARD',
    'shipping_address': '123 Main St, City, Country 12345',
    'items': [
        {'productId': 15, 'quantity': 1, 'price': 33}
    ]
}

print(f"\n2. Order payload:")
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

print(f"\n3. Response Status: {response.status_code}")

try:
    response_data = response.json()
    print(f"\nResponse Body:")
    print(json.dumps(response_data, indent=2, default=str))
except Exception as e:
    print(f"\nResponse Text:")
    print(response.text)

print("\n" + "=" * 70)
