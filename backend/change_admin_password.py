#!/usr/bin/env python
"""
Change admin password
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.users.models import User

# Get the admin user
try:
    admin = User.objects.get(email='admin@example.com')
    admin.set_password('admin123')
    admin.save()
    print(f"✓ Admin password updated successfully")
    print(f"  Email: {admin.email}")
    print(f"  Role: {admin.role}")
except User.DoesNotExist:
    print("✗ Admin user not found")
    sys.exit(1)
