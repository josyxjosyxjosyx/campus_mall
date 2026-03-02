from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.vendors.models import Vendor
from apps.products.models import Product, Category

User = get_user_model()


class FeaturedProductsAPITest(APITestCase):
    def setUp(self):
        # create a user and vendor
        self.user = User.objects.create_user(username="vendor1", email="vendor1@example.com", password="pass")
        self.vendor = Vendor.objects.create(user=self.user, store_name="Test Store")

        # category
        self.cat = Category.objects.create(name="Test Cat", slug="test-cat")

        # products
        self.p_featured_available = Product.objects.create(
            vendor=self.vendor,
            category=self.cat,
            name="Featured Available",
            description="Good product",
            price="10.00",
            stock_quantity=5,
            is_active=True,
            is_featured=True,
            image="products/test.jpg",
        )

        self.p_featured_out = Product.objects.create(
            vendor=self.vendor,
            category=self.cat,
            name="Featured Out",
            description="Out of stock",
            price="5.00",
            stock_quantity=0,
            is_active=True,
            is_featured=True,
            image="products/test2.jpg",
        )

        self.p_not_featured = Product.objects.create(
            vendor=self.vendor,
            category=self.cat,
            name="Not Featured",
            description="Not featured",
            price="7.00",
            stock_quantity=10,
            is_active=True,
            is_featured=False,
            image="products/test3.jpg",
        )

    def test_featured_endpoint_returns_only_available_featured(self):
        url = "/api/products/featured/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # should include only the featured product with stock > 0
        names = [p.get("name") for p in data]
        self.assertIn(self.p_featured_available.name, names)
        self.assertNotIn(self.p_featured_out.name, names)
        self.assertNotIn(self.p_not_featured.name, names)
