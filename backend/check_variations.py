#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.products.models import Product, ProductVariation

print("Checking product variations...")
total_vars = ProductVariation.objects.count()
print(f"Total variations in database: {total_vars}")

if total_vars > 0:
    var = ProductVariation.objects.first()
    print(f"Sample variation: id={var.id}, sku={var.sku}, product_id={var.product_id}")
    print(f"  attributes: {var.attributes}")
    
    # Check how many products have variations
    prods_with_vars = Product.objects.filter(variations__isnull=False).distinct().count()
    print(f"Products with variations: {prods_with_vars}")
    
    p = Product.objects.filter(variations__isnull=False).first()
    if p:
        vars_list = p.variations.all()
        print(f"Product '{p.name}' has {vars_list.count()} variations:")
        for v in vars_list:
            print(f"  - {v.sku}: {v.attributes}")
else:
    print("No variations found in database. Need to create some test data!")
