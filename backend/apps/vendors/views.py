"""
Vendor views for store management.
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsVendor
from .models import Vendor
from .serializers import VendorSerializer, VendorDetailSerializer


class VendorViewSet(viewsets.ModelViewSet):
    """ViewSet for vendor management."""
    
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VendorDetailSerializer
        return VendorSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Vendor.objects.all()
        elif user.role == 'VENDOR':
            return Vendor.objects.filter(user=user)
        else:
            return Vendor.objects.filter(is_approved=True, is_suspended=False)
    
    def perform_create(self, serializer):
        user = self.request.user
        if Vendor.objects.filter(user=user).exists():
            raise serializers.ValidationError('User already has a vendor profile')
        if not serializer.validated_data.get('selling_category'):
            raise serializers.ValidationError('Selling category is required for vendors')
        serializer.save(user=user)
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated, IsVendor])
    def my_store(self, request):
        """Get or update current vendor's store profile."""
        try:
            vendor = Vendor.objects.get(user=request.user)
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = self.get_serializer(vendor)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            if 'selling_category' in request.data and request.data.get('selling_category') in ['', None, 'null']:
                return Response(
                    {'error': 'Selling category cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = self.get_serializer(vendor, data=request.data, partial=True)
            if serializer.is_valid():
                try:
                    serializer.save()
                    return Response(serializer.data)
                except Exception as e:
                    return Response(
                        {'error': f'Failed to save vendor profile: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(
                {'errors': serializer.errors, 'detail': 'Validation failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def become_vendor(self, request):
        """Convert customer to vendor."""
        if request.user.role != 'CUSTOMER':
            return Response(
                {'error': 'Only customers can become vendors'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Vendor.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'User already has a vendor profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            if not serializer.validated_data.get('selling_category'):
                return Response(
                    {'error': 'Selling category is required for vendors'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer.save(user=request.user)
            # Update user role
            request.user.role = 'VENDOR'
            request.user.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
