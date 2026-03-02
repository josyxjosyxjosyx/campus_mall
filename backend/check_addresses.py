#!/usr/bin/env python
"""Check addresses in the database."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import Address, User

print("=" * 60)
print("ALL ADDRESSES IN DATABASE")
print("=" * 60)

all_addresses = Address.objects.all()
print(f"\nTotal addresses: {all_addresses.count()}")

for addr in all_addresses:
    print(f"\nID: {addr.id}")
    print(f"User: {addr.user.email}")
    print(f"Label: {addr.label}")
    print(f"Address: {addr.street_address}, {addr.city}, {addr.postal_code}, {addr.country}")
    print(f"Is Default: {addr.is_default}")
    print("-" * 40)

# Also check users
print("\n" + "=" * 60)
print("ALL USERS IN DATABASE")
print("=" * 60)
users = User.objects.all()
print(f"\nTotal users: {users.count()}")
for user in users:
    address_count = user.addresses.count()
    print(f"\n{user.email} - Role: {user.role} - Addresses: {address_count}")
