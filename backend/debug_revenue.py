#!/usr/bin/env python
"""
Debug revenue and orders to identify why completed orders may not appear in reports.
Runs simple queries against the Django ORM and prints summaries.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.orders.models import Order, OrderItem
from apps.users.models import User


def format_money(v):
    try:
        return f"${float(v):.2f}"
    except Exception:
        return str(v)


def main():
    print("\n=== ORDERS SUMMARY ===\n")
    qs = Order.objects.all().order_by('-created_at')
    print(f"Total orders: {qs.count()}")

    for o in qs:
        print(f"Order ID: {o.id} | customer: {getattr(o.customer, 'username', 'Unknown')} | status: {o.status} | payment_status: {o.payment_status} | total_amount: {format_money(o.total_amount)} | created_at: {o.created_at}")
        items = o.items.all()
        item_total = 0
        for it in items:
            line = float(it.price) * int(it.quantity)
            item_total += line
            print(f"  - Item: {getattr(it.product, 'name', 'Unknown')} | price: {format_money(it.price)} | qty: {it.quantity} | line_total: {format_money(line)}")
        print(f"  Calculated items total: {format_money(item_total)}")
        if float(o.total_amount or 0) != round(item_total, 2):
            print("  -> WARNING: order.total_amount does not match sum of items")
        print("")

    completed = Order.objects.filter(payment_status='COMPLETED')
    pending = Order.objects.filter(payment_status='PENDING')
    print("\n=== AGGREGATES ===\n")
    print(f"Completed orders count: {completed.count()}")
    print(f"Pending orders count: {pending.count()}")
    total_completed = completed.aggregate(total_amount_sum=django.db.models.Sum('total_amount'))['total_amount_sum'] or 0
    total_all = Order.objects.aggregate(total_amount_sum=django.db.models.Sum('total_amount'))['total_amount_sum'] or 0
    print(f"Total completed revenue: {format_money(total_completed)}")
    print(f"Total all orders amount: {format_money(total_all)}")

    # Check customers with multiple orders
    print("\n=== CUSTOMER ORDER COUNTS ===\n")
    from django.db.models import Count
    by_customer = Order.objects.values('customer').annotate(count=Count('id')).order_by('-count')[:20]
    for entry in by_customer:
        try:
            user = User.objects.get(id=entry['customer'])
            print(f"{user.username} ({user.email}) - orders: {entry['count']}")
        except User.DoesNotExist:
            print(f"Unknown user id {entry['customer']} - orders: {entry['count']}")


if __name__ == '__main__':
    main()
