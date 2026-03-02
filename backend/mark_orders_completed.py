#!/usr/bin/env python
"""
Mark specific orders as COMPLETED for manual reconciliation (for testing).
Run: python mark_orders_completed.py
"""
import os
import sys
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.orders.models import Order


ORDER_IDS = [
    'f49fff4e-0ec6-454b-9aa4-a1426596f1d4',
    'df3c504b-f506-4d88-9dc5-6aff406935a2'
]


def main():
    for oid in ORDER_IDS:
        try:
            o = Order.objects.get(id=oid)
        except Order.DoesNotExist:
            print(f"Order not found: {oid}")
            continue

        prev = (o.payment_status, o.payment_reference)
        o.payment_status = 'COMPLETED'
        if not o.payment_reference:
            o.payment_reference = f"manual-reconcile-{datetime.utcnow().isoformat()}"
        o.save()
        print(f"Updated order {oid}: payment_status {prev[0]} -> {o.payment_status}, payment_reference set -> {o.payment_reference}")


if __name__ == '__main__':
    main()
