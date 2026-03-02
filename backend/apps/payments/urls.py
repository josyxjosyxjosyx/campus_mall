from django.urls import path
from . import views

urlpatterns = [
    path("stripe/create-intent/", views.stripe_create_intent),
    path("paystack/initialize/", views.paystack_initialize),
    path("paystack/verify/", views.paystack_verify),
    path("stripe/webhook/", views.stripe_webhook),
]
