"""
Create initial test data fixtures.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.vendors.models import Vendor
from apps.products.models import Category, Product
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Create initial test data fixtures'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')
        
        # Create admin user
        if not User.objects.filter(email='admin@example.com').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                role='ADMIN'
            )
            self.stdout.write(f'✓ Created admin user: {admin.email}')
        
        # Create test vendors
        vendors_data = [
            {
                'email': 'vendor1@example.com',
                'name': 'Tech Store',
                'store_name': 'Tech Store Pro'
            },
            {
                'email': 'vendor2@example.com',
                'name': 'Fashion Hub',
                'store_name': 'Fashion Hub Plus'
            },
            {
                'email': 'vendor3@example.com',
                'name': 'Home Shop',
                'store_name': 'Home Shop Express'
            },
        ]
        
        for vendor_data in vendors_data:
            if not User.objects.filter(email=vendor_data['email']).exists():
                user = User.objects.create_user(
                    username=vendor_data['email'],
                    email=vendor_data['email'],
                    password='vendor123',
                    first_name=vendor_data['name'],
                    role='VENDOR'
                )
                
                vendor = Vendor.objects.create(
                    user=user,
                    store_name=vendor_data['store_name'],
                    description=f'Welcome to {vendor_data["store_name"]}',
                    is_approved=True,
                    rating=Decimal('4.5')
                )
                self.stdout.write(f'✓ Created vendor: {vendor.store_name}')
        
        # Create categories
        categories_data = [
            {'name': 'Electronics', 'slug': 'electronics'},
            {'name': 'Clothing', 'slug': 'clothing'},
            {'name': 'Accessories', 'slug': 'accessories'},
            {'name': 'Home & Living', 'slug': 'home-living'},
            {'name': 'Beauty', 'slug': 'beauty'},
        ]
        
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name']}
            )
            if created:
                self.stdout.write(f'✓ Created category: {category.name}')
        
        # Create test products
        vendors = Vendor.objects.all()[:3]
        categories = Category.objects.all()
        
        products_data = [
            {'name': 'Laptop Pro', 'price': '1299.99', 'stock': 10},
            {'name': 'Wireless Mouse', 'price': '29.99', 'stock': 50},
            {'name': 'USB-C Cable', 'price': '19.99', 'stock': 100},
            {'name': 'T-Shirt', 'price': '24.99', 'stock': 30},
            {'name': 'Jeans', 'price': '49.99', 'stock': 25},
            {'name': 'Sneakers', 'price': '89.99', 'stock': 20},
            {'name': 'Coffee Mug', 'price': '12.99', 'stock': 40},
        ]
        
        for idx, product_data in enumerate(products_data):
            vendor = vendors[idx % len(vendors)]
            category = categories[idx % len(categories)]
            
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                vendor=vendor,
                defaults={
                    'category': category,
                    'description': f'High-quality {product_data["name"]}',
                    'price': Decimal(product_data['price']),
                    'image': f'https://via.placeholder.com/400x300?text={product_data["name"].replace(" ", "+")}',
                    'stock_quantity': product_data['stock'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'✓ Created product: {product.name}')
        
        # Create test customer
        if not User.objects.filter(email='customer@example.com').exists():
            customer = User.objects.create_user(
                username='customer@example.com',
                email='customer@example.com',
                password='customer123',
                first_name='John',
                role='CUSTOMER'
            )
            self.stdout.write(f'✓ Created customer: {customer.email}')
        
        self.stdout.write(self.style.SUCCESS('✓ Test data created successfully!'))
