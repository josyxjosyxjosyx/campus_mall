"""
Apps configuration for products app.
"""
from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
    
    def ready(self):
        """Register signals when app is ready."""
        import apps.products.signals
