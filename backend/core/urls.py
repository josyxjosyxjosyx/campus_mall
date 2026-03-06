"""
URL Configuration for MarketHub project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.products.views import ProductViewSet, CategoryViewSet, ProductReviewViewSet, WishlistViewSet
from apps.orders.views import OrderViewSet
from apps.vendors.views import VendorViewSet
from apps.testimonials.views import TestimonialViewSet
from apps.users.views import login_view, register_view, profile_view, AddressViewSet, check_email_view
from apps.admin_panel.views import (
    admin_stats, sales_summary, vendor_sales_report, get_all_users, update_user_status,
    approve_vendor, suspend_vendor, get_all_vendors,
    bulk_update_vendor_category,
    get_all_categories, create_category, update_category, delete_category,
    get_all_orders, download_report_csv, download_report_pdf
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'reviews', ProductReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Authentication endpoints
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/check_email/', check_email_view, name='check_email'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', profile_view, name='profile'),
    
    # Main API routes
    path('api/', include(router.urls)),
    
    # Admin endpoints
    path('api/admin/stats/', admin_stats, name='admin_stats'),
    path('api/admin/reports/', sales_summary, name='sales_summary'),
    path('api/admin/reports/vendors/', vendor_sales_report, name='vendor_sales_report'),
    path('api/admin/reports/vendors/<int:vendor_id>/', vendor_sales_report, name='vendor_sales_report_detail'),
    path('api/admin/reports/download/csv/', download_report_csv, name='download_report_csv'),
    path('api/admin/reports/download/pdf/', download_report_pdf, name='download_report_pdf'),
    path('api/admin/users/', get_all_users, name='get_all_users'),
    path('api/admin/users/<int:user_id>/status/', update_user_status, name='update_user_status'),
    path('api/admin/vendors/', get_all_vendors, name='get_all_vendors'),
    path('api/admin/vendors/<int:vendor_id>/approve/', approve_vendor, name='approve_vendor'),
    path('api/admin/vendors/<int:vendor_id>/suspend/', suspend_vendor, name='suspend_vendor'),
    path('api/admin/vendors/category/bulk-update/', bulk_update_vendor_category, name='bulk_update_vendor_category'),
    path('api/admin/categories/', get_all_categories, name='get_all_categories'),
    path('api/admin/categories/create/', create_category, name='create_category'),
    path('api/admin/categories/<int:category_id>/', update_category, name='update_category'),
    path('api/admin/categories/<int:category_id>/delete/', delete_category, name='delete_category'),
    path('api/admin/orders/', get_all_orders, name='get_all_orders'),
    # Payments (Stripe, Paystack)
    path('api/payments/', include('apps.payments.urls')),
    # Coupons
    path('api/', include('apps.coupons.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
