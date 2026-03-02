#!/usr/bin/env python
"""Test the address API endpoint."""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User, Address
from apps.users.serializers import AddressSerializer
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from apps.users.views import AddressViewSet

# Create test user and address
print("=" * 60)
print("TESTING ADDRESS API")
print("=" * 60)

# Get or create a test user
user, created = User.objects.get_or_create(
    email='testuser@example.com',
    defaults={
        'name': 'Test User',
        'role': 'CUSTOMER'
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"\n✓ Created test user: {user.email}")
else:
    print(f"\n✓ Using existing test user: {user.email}")

# Create a test address if none exist
if not user.addresses.exists():
    addr = Address.objects.create(
        user=user,
        label='Test Home',
        street_address='123 Main St',
        city='Springfield',
        postal_code='12345',
        country='USA',
        is_default=True
    )
    print(f"✓ Created test address: {addr.label}")
else:
    addr = user.addresses.first()
    print(f"✓ Using existing address: {addr.label}")

# Test the serializer
print("\n" + "=" * 60)
print("ADDRESS SERIALIZER OUTPUT")
print("=" * 60)
serializer = AddressSerializer(user.addresses.all(), many=True)
print(f"\nNumber of addresses: {len(serializer.data)}")
print(json.dumps(serializer.data, indent=2))

# Test the viewset
print("\n" + "=" * 60)
print("API VIEW TEST")
print("=" * 60)
factory = APIRequestFactory()
view = AddressViewSet.as_view({'get': 'list'})
request_obj = factory.get('/api/addresses/')
request_obj.user = user

# Test unauthenticated
request_obj_unauth = factory.get('/api/addresses/')
print(f"\nUser: {user.email}")
print(f"User addresses count: {user.addresses.count()}")
