"""
Signals for product app.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ProductReview, Product
from django.db.models import Avg


@receiver(post_save, sender=ProductReview)
def update_product_rating_on_review_save(sender, instance, created, **kwargs):
    """Update product rating when a review is saved."""
    if instance.is_approved:
        update_product_rating(instance.product)


@receiver(post_delete, sender=ProductReview)
def update_product_rating_on_review_delete(sender, instance, **kwargs):
    """Update product rating when a review is deleted."""
    update_product_rating(instance.product)


def update_product_rating(product):
    """Calculate and update the average rating for a product."""
    avg_rating = ProductReview.objects.filter(
        product=product,
        is_approved=True
    ).aggregate(avg_rating=Avg('rating'))['avg_rating']
    
    if avg_rating is not None:
        product.rating = round(float(avg_rating), 2)
    else:
        product.rating = 0
    
    product.save(update_fields=['rating', 'updated_at'])
