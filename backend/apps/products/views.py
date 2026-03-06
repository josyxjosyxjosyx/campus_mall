"""
Product views for catalog management.
"""
from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from apps.users.permissions import IsVendor, IsVendorOrReadOnly
from .models import Product, Category, ProductImage, ProductVariation, VariationImage, ProductReview
from .serializers import ProductSerializer, ProductDetailSerializer, CategorySerializer, ProductReviewSerializer
from .models import WishlistItem
from .serializers import WishlistItemSerializer
import json

def _create_gallery_images(product, files):
    for i, f in enumerate(files):
        ProductImage.objects.create(product=product, image=f, order=i)

def _sync_variations(product, variations_json, files):
    """Sync product variations with the provided JSON list.

    - If an incoming variation contains `id`, attempt to update that variation.
    - If no `id`, create a new variation.
    - Any existing variations not present in the incoming list will be deleted.
    Per-variation images can be provided in files under keys like
    `variation_images_0` (array), `variation_images_1`, etc., where index matches
    the incoming list order.
    """
    try:
        variations = json.loads(variations_json)
    except Exception:
        return

    existing_qs = ProductVariation.objects.filter(product=product)
    existing_ids = set(existing_qs.values_list('id', flat=True))
    incoming_ids = set()

    for idx, v in enumerate(variations):
        vid = v.get('id')
        if vid:
            try:
                var = ProductVariation.objects.get(id=vid, product=product)
                # update fields
                var.sku = v.get('sku') or var.sku
                var.price = v.get('price') if v.get('price') is not None else var.price
                var.attributes = v.get('attributes') or var.attributes
                var.stock_quantity = v.get('stock_quantity', var.stock_quantity)
                var.manage_stock = v.get('manage_stock', var.manage_stock)
                var.allow_backorders = v.get('allow_backorders', var.allow_backorders)
                var.is_active = v.get('is_active', var.is_active)
                var.save()
                incoming_ids.add(var.id)
            except ProductVariation.DoesNotExist:
                # treat as new variation
                var = ProductVariation.objects.create(
                    product=product,
                    sku=v.get('sku') or None,
                    price=v.get('price') or None,
                    attributes=v.get('attributes') or {},
                    stock_quantity=v.get('stock_quantity', 0),
                    manage_stock=v.get('manage_stock', True),
                    allow_backorders=v.get('allow_backorders', False),
                    is_active=v.get('is_active', True)
                )
                incoming_ids.add(var.id)
        else:
            var = ProductVariation.objects.create(
                product=product,
                sku=v.get('sku') or None,
                price=v.get('price') or None,
                attributes=v.get('attributes') or {},
                stock_quantity=v.get('stock_quantity', 0),
                manage_stock=v.get('manage_stock', True),
                allow_backorders=v.get('allow_backorders', False),
                is_active=v.get('is_active', True)
            )
            incoming_ids.add(var.id)

        # handle variation images for this variation (append)
        key = f'variation_images_{idx}'
        if key in files:
            file_list = files.getlist(key)
            for j, img in enumerate(file_list):
                VariationImage.objects.create(variation=var, image=img, order=j)

    # Delete removed variations
    to_delete = existing_ids - incoming_ids
    if to_delete:
        ProductVariation.objects.filter(id__in=to_delete, product=product).delete()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for product categories (read-only)."""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for product management."""
    
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'vendor', 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'rating']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        """Return appropriate queryset depending on action.

        - For public listing and featured endpoints, only return active products.
        - For other actions (retrieve/update/destroy) return full queryset so
          vendors can edit their own inactive products via `my_products`.
        """
        if self.action in ['list', 'featured']:
            return Product.objects.filter(is_active=True)
        return Product.objects.all()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsVendor]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        try:
            vendor = self.request.user.vendor_profile
        except:
            raise serializers.ValidationError('Vendor profile not found. Please complete your vendor profile.')

        selected_category = serializer.validated_data.get('category')
        if not vendor.selling_category_id:
            raise serializers.ValidationError('Please set your vendor selling category before adding products.')
        if not selected_category:
            raise serializers.ValidationError('Product category is required.')
        if selected_category.id != vendor.selling_category_id:
            raise serializers.ValidationError(
                f'You can only create products in your assigned category: {vendor.selling_category.name}.'
            )
        product = serializer.save(vendor=vendor, is_active=True)

        # Handle gallery images uploaded as `images[]`
        files = self.request.FILES
        if 'images' in files:
            _create_gallery_images(product, files.getlist('images'))

        # Handle variations JSON and per-variation images (sync existing/new/delete)
        variations_json = self.request.POST.get('variations')
        if variations_json:
            _sync_variations(product, variations_json, files)
    
    def perform_update(self, serializer):
        try:
            vendor = self.request.user.vendor_profile
        except:
            raise serializers.ValidationError('Vendor profile not found. Please complete your vendor profile.')
        if serializer.instance.vendor != vendor:
            raise serializers.ValidationError('You can only edit your own products')

        target_category = serializer.validated_data.get('category', serializer.instance.category)
        if not vendor.selling_category_id:
            raise serializers.ValidationError('Please set your vendor selling category before editing products.')
        if not target_category:
            raise serializers.ValidationError('Product category is required.')
        if target_category.id != vendor.selling_category_id:
            raise serializers.ValidationError(
                f'You can only assign products to your allowed category: {vendor.selling_category.name}.'
            )
        # If vendor marks product as featured ensure it's active so it can appear
        # on the storefront. Otherwise save normally.
        try:
            is_featured = serializer.validated_data.get('is_featured')
        except Exception:
            is_featured = None

        product = None
        if is_featured:
            product = serializer.save(is_active=True)
        else:
            product = serializer.save()

        # If gallery images uploaded, append them
        files = self.request.FILES
        if 'images' in files:
            _create_gallery_images(product, files.getlist('images'))

        # Update or sync variations if provided
        variations_json = self.request.POST.get('variations')
        if variations_json:
            _sync_variations(product, variations_json, files)
    
    def perform_destroy(self, instance):
        if instance.vendor.user != self.request.user:
            raise serializers.ValidationError('You can only delete your own products')
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def by_vendor(self, request):
        """Get products by specific vendor."""
        vendor_id = request.query_params.get('vendor_id')
        if not vendor_id:
            return Response(
                {'error': 'vendor_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products = self.queryset.filter(vendor_id=vendor_id)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsVendor])
    def my_products(self, request):
        """Get current vendor's products (including inactive ones)."""
        try:
            vendor = request.user.vendor_profile
        except:
            return Response(
                {'error': 'Vendor profile not found. Please complete your vendor profile.'},
                status=status.HTTP_404_NOT_FOUND
            )
        # Show ALL products for the vendor, not just active ones
        products = Product.objects.filter(vendor=vendor).order_by('-created_at')
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def featured(self, request):
        """Return featured products that are available (stock > 0 and active)."""
        products = Product.objects.filter(is_featured=True, stock_quantity__gt=0, is_active=True).order_by('-created_at')
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class ProductReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for product reviews."""
    
    queryset = ProductReview.objects.filter(is_approved=True).order_by('-created_at')
    serializer_class = ProductReviewSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product']
    search_fields = ['customer_name', 'title', 'content']
    
    def perform_create(self, serializer):
        """Create a new review."""
        serializer.save(is_approved=True)
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Get reviews for a specific product."""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        reviews = ProductReview.objects.filter(
            product_id=product_id,
            is_approved=True
        ).order_by('-created_at')
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsVendor])
    def my_product_reviews(self, request):
        """Get all reviews for authenticated vendor's products."""
        try:
            vendor = request.user.vendor_profile
        except Exception:
            return Response({'error': 'Vendor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get all products for this vendor
        vendor_products = Product.objects.filter(vendor=vendor).values_list('id', flat=True)
        
        # Get all reviews for those products (including unapproved for vendor to moderate)
        reviews = ProductReview.objects.filter(
            product_id__in=vendor_products
        ).order_by('-created_at')
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user wishlist/watchlist."""

    queryset = WishlistItem.objects.all()
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users should only see their own wishlist
        return WishlistItem.objects.filter(user=self.request.user).select_related('product')

    def create(self, request, *args, **kwargs):
        # Expect payload { product_id: <id> }
        serializer = WishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data.get('product_id')
        # Ensure product exists
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        out = WishlistItemSerializer(item)
        return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        # delete by id
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
