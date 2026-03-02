"""
Views for coupon management.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsVendor
from .models import Coupon
from .serializers import CouponSerializer, CouponCreateUpdateSerializer
from django_filters.rest_framework import DjangoFilterBackend


class CouponViewSet(viewsets.ModelViewSet):
    """ViewSet for coupon management."""
    
    permission_classes = [IsAuthenticated, IsVendor]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'code']
    search_fields = ['code', 'description']
    ordering_fields = ['created_at', 'discount_percentage']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get coupons for current vendor."""
        user = self.request.user
        if user.role != 'VENDOR':
            return Coupon.objects.none()
        
        try:
            vendor = user.vendor_profile
            return Coupon.objects.filter(vendor=vendor)
        except:
            return Coupon.objects.none()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return CouponCreateUpdateSerializer
        return CouponSerializer
    
    def perform_create(self, serializer):
        """Create coupon for current vendor."""
        try:
            vendor = self.request.user.vendor_profile
            serializer.save(vendor=vendor)
        except:
            from rest_framework import serializers as rest_serializers
            raise rest_serializers.ValidationError("Vendor profile not found")
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active coupons for current vendor."""
        coupons = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(coupons, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_usage(self, request, pk=None):
        """Increment coupon usage count."""
        coupon = self.get_object()
        if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
            return Response(
                {'error': 'Coupon usage limit reached'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        coupon.current_uses += 1
        coupon.save()
        serializer = self.get_serializer(coupon)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        """Validate if a coupon code is valid and applicable."""
        code = request.data.get('code', '').upper()
        product_id = request.data.get('product_id')
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Coupon code not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if coupon is valid
        if not coupon.is_valid():
            return Response({
                'valid': False,
                'error': 'Coupon is expired or unavailable'
            })
        
        # Check if applies to product if product_id provided
        if product_id:
            from apps.products.models import Product
            try:
                product = Product.objects.get(id=product_id)
                if not coupon.can_apply_to_product(product):
                    return Response({
                        'valid': False,
                        'error': 'Coupon does not apply to this product'
                    })
            except Product.DoesNotExist:
                return Response(
                    {'valid': False, 'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = self.get_serializer(coupon)
        return Response({
            'valid': True,
            'coupon': serializer.data
        })
