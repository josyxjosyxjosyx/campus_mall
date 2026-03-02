"""
Admin panel views for platform administration.
"""
import csv
from datetime import datetime
from io import StringIO

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField
from django.http import HttpResponse
from apps.users.models import User
from apps.users.permissions import IsAdmin
from apps.vendors.models import Vendor
from apps.products.models import Product, Category
from apps.orders.models import Order


def _build_sales_summary_data():
    """Build platform-level summary data payload."""
    orders_by_status = {}
    for status_choice in ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']:
        count = Order.objects.filter(status=status_choice).count()
        total = sum(
            float(o.total_amount) if o.total_amount else 0
            for o in Order.objects.filter(status=status_choice, payment_status='COMPLETED')
        )
        orders_by_status[status_choice] = {
            'count': count,
            'revenue': round(total, 2)
        }

    top_vendors = []
    vendors = Vendor.objects.all()
    for vendor in vendors:
        revenue = sum(
            float(o.total_amount) if o.total_amount else 0
            for o in Order.objects.filter(vendor=vendor, payment_status='COMPLETED')
        )
        if revenue > 0:
            top_vendors.append({
                'vendor_id': vendor.id,
                'vendor_name': vendor.store_name,
                'revenue': round(revenue, 2),
                'order_count': Order.objects.filter(vendor=vendor).count()
            })
    top_vendors.sort(key=lambda x: x['revenue'], reverse=True)

    total_completed = float(Order.objects.filter(payment_status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or 0)
    total_pending = float(Order.objects.filter(payment_status='PENDING').aggregate(total=Sum('total_amount'))['total'] or 0)

    return {
        'orders_by_status': orders_by_status,
        'top_vendors': top_vendors[:10],
        'total_completed_revenue': round(float(total_completed), 2),
        'total_pending_revenue': round(float(total_pending), 2),
        'total_customers': User.objects.filter(role='CUSTOMER').count(),
        'total_active_vendors': Vendor.objects.filter(is_approved=True, is_suspended=False).count(),
    }


def _build_vendor_report_data(vendor):
    """Build detailed vendor report payload."""
    vendor_orders = Order.objects.filter(vendor=vendor)
    total_orders = vendor_orders.count()
    total_revenue = sum(
        float(o.total_amount) if o.total_amount else 0
        for o in vendor_orders.filter(payment_status='COMPLETED')
    )

    orders_by_status = {}
    for status_choice in ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']:
        count = vendor_orders.filter(status=status_choice).count()
        revenue = sum(
            float(o.total_amount) if o.total_amount else 0
            for o in vendor_orders.filter(status=status_choice, payment_status='COMPLETED')
        )
        orders_by_status[status_choice] = {
            'count': count,
            'revenue': round(revenue, 2)
        }

    from apps.orders.models import OrderItem
    products = Product.objects.filter(vendor=vendor)
    product_performance = []
    for product in products:
        product_items = OrderItem.objects.filter(
            order__vendor=vendor,
            product=product,
            order__payment_status='COMPLETED'
        )
        revenue_expr = ExpressionWrapper(F('price') * F('quantity'), output_field=DecimalField(max_digits=12, decimal_places=2))
        agg = product_items.aggregate(total=Sum(revenue_expr))
        product_revenue = float(agg['total'] or 0)

        product_performance.append({
            'product_id': product.id,
            'product_name': product.name,
            'orders': product_items.values('order').distinct().count(),
            'revenue': round(product_revenue, 2)
        })
    product_performance.sort(key=lambda x: x['revenue'], reverse=True)

    unique_customers = vendor_orders.values('customer').distinct().count()
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0

    return {
        'vendor_id': vendor.id,
        'vendor_name': vendor.store_name,
        'store_description': vendor.description,
        'total_orders': total_orders,
        'total_revenue': round(total_revenue, 2),
        'unique_customers': unique_customers,
        'average_order_value': avg_order_value,
        'orders_by_status': orders_by_status,
        'top_products': product_performance[:10],
        'rating': str(vendor.rating),
        'is_approved': vendor.is_approved,
        'is_suspended': vendor.is_suspended,
        'created_at': vendor.created_at.isoformat()
    }


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    """Get admin dashboard statistics."""
    # Use DB aggregate for accurate summation and better performance
    total_revenue_agg = Order.objects.filter(payment_status='COMPLETED').aggregate(total=Sum('total_amount'))
    total_revenue = float(total_revenue_agg['total'] or 0)

    return Response({
        'total_users': User.objects.count(),
        'total_vendors': Vendor.objects.filter(is_approved=True).count(),
        'total_products': Product.objects.filter(is_active=True).count(),
        'total_orders': Order.objects.count(),
        'total_revenue': round(total_revenue, 2),
        'pending_vendors': Vendor.objects.filter(is_approved=False).count(),
        'pending_orders': Order.objects.filter(status__in=['PENDING', 'CONFIRMED']).count(),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def sales_summary(request):
    """Get sales summary and reports."""
    return Response(_build_sales_summary_data())


@api_view(['GET'])
@permission_classes([IsAdmin])
def vendor_sales_report(request, vendor_id=None):
    """Get individual vendor sales report or all vendors list for report."""
    if vendor_id:
        # Get specific vendor report
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        vendor_orders = Order.objects.filter(vendor=vendor)
        return Response(_build_vendor_report_data(vendor))
    else:
        # Get all vendors for report selection
        vendors = Vendor.objects.all()
        vendor_list = []
        for vendor in vendors:
            revenue = sum(
                float(o.total_amount) if o.total_amount else 0
                for o in Order.objects.filter(vendor=vendor, payment_status='COMPLETED')
            )
            vendor_list.append({
                'id': vendor.id,
                'store_name': vendor.store_name,
                'total_revenue': round(revenue, 2),
                'total_orders': Order.objects.filter(vendor=vendor).count(),
                'rating': str(vendor.rating),
                'is_approved': vendor.is_approved
            })
        
        return Response(vendor_list)


def _build_csv_response(scope, vendor=None):
    output = StringIO()
    writer = csv.writer(output)

    if scope == 'platform':
        data = _build_sales_summary_data()
        writer.writerow(['Campus Mall Platform Report'])
        writer.writerow(['Generated At', datetime.utcnow().isoformat()])
        writer.writerow([])
        writer.writerow(['Orders By Status'])
        writer.writerow(['Status', 'Count', 'Revenue'])
        for status_key, status_data in data['orders_by_status'].items():
            writer.writerow([status_key, status_data['count'], status_data['revenue']])
        writer.writerow([])
        writer.writerow(['Top Vendors'])
        writer.writerow(['Vendor ID', 'Vendor Name', 'Revenue', 'Order Count'])
        for row in data['top_vendors']:
            writer.writerow([row['vendor_id'], row['vendor_name'], row['revenue'], row['order_count']])
        writer.writerow([])
        writer.writerow(['Totals'])
        writer.writerow(['Completed Revenue', data['total_completed_revenue']])
        writer.writerow(['Pending Revenue', data['total_pending_revenue']])
        writer.writerow(['Total Customers', data['total_customers']])
        writer.writerow(['Active Vendors', data['total_active_vendors']])
        filename = f'platform_report_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
    else:
        data = _build_vendor_report_data(vendor)
        writer.writerow([f'Vendor Report - {data["vendor_name"]}'])
        writer.writerow(['Generated At', datetime.utcnow().isoformat()])
        writer.writerow([])
        writer.writerow(['Summary'])
        writer.writerow(['Vendor ID', data['vendor_id']])
        writer.writerow(['Total Orders', data['total_orders']])
        writer.writerow(['Total Revenue', data['total_revenue']])
        writer.writerow(['Unique Customers', data['unique_customers']])
        writer.writerow(['Average Order Value', data['average_order_value']])
        writer.writerow([])
        writer.writerow(['Orders By Status'])
        writer.writerow(['Status', 'Count', 'Revenue'])
        for status_key, status_data in data['orders_by_status'].items():
            writer.writerow([status_key, status_data['count'], status_data['revenue']])
        writer.writerow([])
        writer.writerow(['Top Products'])
        writer.writerow(['Product ID', 'Product Name', 'Orders', 'Revenue'])
        for product in data['top_products']:
            writer.writerow([product['product_id'], product['product_name'], product['orders'], product['revenue']])
        filename = f'vendor_report_{data["vendor_id"]}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'

    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _build_pdf_response(scope, vendor=None):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
    except ImportError:
        return Response(
            {'error': 'PDF export dependency missing. Install reportlab.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    response = HttpResponse(content_type='application/pdf')
    filename = f'{scope}_report_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.pdf'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    y = height - 50

    def draw_line(text, size=10):
        nonlocal y
        if y < 40:
            pdf.showPage()
            y = height - 50
        pdf.setFont("Helvetica", size)
        pdf.drawString(40, y, str(text))
        y -= 16

    draw_line("Campus Mall Report Export", size=14)
    draw_line(f"Generated: {datetime.utcnow().isoformat()}")
    draw_line("")

    if scope == 'platform':
        data = _build_sales_summary_data()
        draw_line("Platform Summary", size=12)
        draw_line(f"Completed Revenue: {data['total_completed_revenue']}")
        draw_line(f"Pending Revenue: {data['total_pending_revenue']}")
        draw_line(f"Total Customers: {data['total_customers']}")
        draw_line(f"Active Vendors: {data['total_active_vendors']}")
        draw_line("")
        draw_line("Orders By Status", size=12)
        for status_key, status_data in data['orders_by_status'].items():
            draw_line(f"- {status_key}: {status_data['count']} orders, revenue {status_data['revenue']}")
        draw_line("")
        draw_line("Top Vendors", size=12)
        for row in data['top_vendors']:
            draw_line(f"- {row['vendor_name']} (ID {row['vendor_id']}): {row['order_count']} orders, revenue {row['revenue']}")
    else:
        data = _build_vendor_report_data(vendor)
        draw_line(f"Vendor Report: {data['vendor_name']}", size=12)
        draw_line(f"Vendor ID: {data['vendor_id']}")
        draw_line(f"Total Orders: {data['total_orders']}")
        draw_line(f"Total Revenue: {data['total_revenue']}")
        draw_line(f"Unique Customers: {data['unique_customers']}")
        draw_line(f"Average Order Value: {data['average_order_value']}")
        draw_line("")
        draw_line("Orders By Status", size=12)
        for status_key, status_data in data['orders_by_status'].items():
            draw_line(f"- {status_key}: {status_data['count']} orders, revenue {status_data['revenue']}")
        draw_line("")
        draw_line("Top Products", size=12)
        for product in data['top_products']:
            draw_line(f"- {product['product_name']} (ID {product['product_id']}): {product['orders']} orders, revenue {product['revenue']}")

    pdf.save()
    return response


@api_view(['GET'])
@permission_classes([IsAdmin])
def download_report_csv(request):
    """Download platform or vendor report as CSV.

    Query params:
    - scope: platform|vendor (default: platform)
    - vendor_id: required when scope=vendor
    """
    scope = request.query_params.get('scope', 'platform')
    if scope == 'vendor':
        vendor_id = request.query_params.get('vendor_id')
        if not vendor_id:
            return Response({'error': 'vendor_id is required for vendor scope'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
        return _build_csv_response('vendor', vendor=vendor)
    return _build_csv_response('platform')


@api_view(['GET'])
@permission_classes([IsAdmin])
def download_report_pdf(request):
    """Download platform or vendor report as PDF.

    Query params:
    - scope: platform|vendor (default: platform)
    - vendor_id: required when scope=vendor
    """
    scope = request.query_params.get('scope', 'platform')
    if scope == 'vendor':
        vendor_id = request.query_params.get('vendor_id')
        if not vendor_id:
            return Response({'error': 'vendor_id is required for vendor scope'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
        return _build_pdf_response('vendor', vendor=vendor)
    return _build_pdf_response('platform')


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_all_users(request):
    """Get all users with optional role filter."""
    role = request.query_params.get('role')
    users = User.objects.all()
    
    if role:
        users = users.filter(role=role)
    
    return Response({
        'count': users.count(),
        'users': [
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'is_approved': getattr(user, 'is_approved', True),
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None
            }
            for user in users
        ]
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def update_user_status(request, user_id):
    """Update user active status."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle both is_active boolean and status string formats
    is_active = request.data.get('is_active')
    status_value = request.data.get('status')
    
    if is_active is not None:
        user.is_active = is_active
    elif status_value == 'SUSPENDED':
        user.is_active = False
    elif status_value == 'ACTIVE':
        user.is_active = True
    else:
        return Response(
            {'error': 'Invalid status. Provide is_active boolean or status string'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.save()
    return Response({
        'success': True,
        'message': f'User status updated',
        'user': {
            'id': user.id,
            'email': user.email,
            'is_active': user.is_active
        }
    })



@api_view(['GET'])
@permission_classes([IsAdmin])
def get_all_vendors(request):
    """Get all vendors with approval status."""
    vendors = Vendor.objects.all()
    
    return Response({
        'count': vendors.count(),
        'vendors': [
            {
                'id': vendor.id,
                'name': vendor.store_name,
                'phone': getattr(vendor, 'phone', ''),
                'address': getattr(vendor, 'address', ''),
                'description': vendor.description or '',
                'selling_category_id': vendor.selling_category_id,
                'selling_category_name': vendor.selling_category.name if vendor.selling_category else None,
                'is_approved': vendor.is_approved,
                'is_suspended': vendor.is_suspended,
                'rating': str(vendor.rating),
                'user': {
                    'id': vendor.user.id,
                    'username': vendor.user.username,
                    'email': vendor.user.email,
                    'role': vendor.user.role,
                    'is_active': vendor.user.is_active,
                    'is_approved': vendor.user.is_approved
                },
                'created_at': vendor.created_at.isoformat()
            }
            for vendor in vendors
        ]
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_vendor(request, vendor_id):
    """Approve a vendor."""
    try:
        vendor = Vendor.objects.get(id=vendor_id)
    except Vendor.DoesNotExist:
        return Response(
            {'error': 'Vendor not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update both vendor and user approval status
    vendor.is_approved = True
    vendor.is_suspended = False
    vendor.save()
    
    # Also update the associated user's approval status
    vendor.user.is_approved = True
    vendor.user.save()
    
    return Response({
        'success': True,
        'message': 'Vendor approved successfully',
        'vendor': {
            'id': vendor.id,
            'store_name': vendor.store_name,
            'is_approved': vendor.is_approved
        }
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def suspend_vendor(request, vendor_id):
    """Suspend a vendor."""
    try:
        vendor = Vendor.objects.get(id=vendor_id)
    except Vendor.DoesNotExist:
        return Response(
            {'error': 'Vendor not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    vendor.is_suspended = True
    vendor.save()
    
    # Also deactivate the associated user account
    vendor.user.is_active = False
    vendor.user.save()
    
    return Response({
        'success': True,
        'message': 'Vendor suspended successfully',
        'vendor': {
            'id': vendor.id,
            'store_name': vendor.store_name,
            'is_suspended': vendor.is_suspended
        }
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def bulk_update_vendor_category(request):
    """Bulk update vendors' selling category.

    Payload:
    - vendor_ids: number[]
    - selling_category_id: number
    """
    vendor_ids = request.data.get('vendor_ids') or []
    selling_category_id = request.data.get('selling_category_id')

    if not isinstance(vendor_ids, list) or len(vendor_ids) == 0:
        return Response(
            {'error': 'vendor_ids must be a non-empty list'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not selling_category_id:
        return Response(
            {'error': 'selling_category_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        category = Category.objects.get(id=int(selling_category_id))
    except (ValueError, TypeError, Category.DoesNotExist):
        return Response(
            {'error': 'Invalid selling category'},
            status=status.HTTP_400_BAD_REQUEST
        )

    vendors = Vendor.objects.filter(id__in=vendor_ids)
    if not vendors.exists():
        return Response(
            {'error': 'No vendors found for provided vendor_ids'},
            status=status.HTTP_404_NOT_FOUND
        )

    updated_count = vendors.update(selling_category=category)

    return Response({
        'success': True,
        'message': f'Updated {updated_count} vendor(s) to category "{category.name}"',
        'updated_count': updated_count,
        'selling_category': {
            'id': category.id,
            'name': category.name,
        }
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_all_categories(request):
    """Get all product categories with parent/subcategory metadata."""
    categories = Category.objects.select_related('parent').prefetch_related('children').order_by('name')
    product_count_map = {
        row['category']: row['count']
        for row in Product.objects.values('category').annotate(count=Count('id'))
    }

    payload = []
    for category in categories:
        children = list(category.children.all().order_by('name'))
        payload.append({
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'image': category.image.url if category.image else None,
            'parent_id': category.parent_id,
            'parent_name': category.parent.name if category.parent else None,
            'is_subcategory': category.parent_id is not None,
            'product_count': product_count_map.get(category.id, 0),
            'subcategories_count': len(children),
            'subcategories': [
                {
                    'id': child.id,
                    'name': child.name,
                    'slug': child.slug,
                    'image': child.image.url if child.image else None,
                    'product_count': product_count_map.get(child.id, 0),
                    'parent_id': category.id,
                    'parent_name': category.name,
                    'is_subcategory': True,
                }
                for child in children
            ],
            'created_at': category.created_at.isoformat() if hasattr(category, 'created_at') else None
        })
    return Response(payload)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_category(request):
    """Create a new product category."""
    name = request.data.get('name')
    slug = request.data.get('slug')
    image = request.FILES.get('image')
    parent_id = request.data.get('parent_id')
    
    if not name or not slug:
        return Response(
            {'error': 'name and slug are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if category with this slug already exists
    if Category.objects.filter(slug=slug).exists():
        return Response(
            {'error': 'Category with this slug already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    parent = None
    if parent_id not in (None, '', 'null'):
        try:
            parent = Category.objects.get(id=int(parent_id))
        except (ValueError, TypeError, Category.DoesNotExist):
            return Response(
                {'error': 'Invalid parent category'},
                status=status.HTTP_400_BAD_REQUEST
            )

    category = Category.objects.create(name=name, slug=slug, image=image, parent=parent)
    
    return Response({
        'success': True,
        'message': 'Category created successfully',
        'category': {
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'image': category.image.url if category.image else None,
            'parent_id': category.parent_id,
            'parent_name': category.parent.name if category.parent else None,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAdmin])
def update_category(request, category_id):
    """Update a product category."""
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if 'name' in request.data:
        category.name = request.data['name']
    if 'slug' in request.data:
        # Check if new slug is already in use by another category
        if Category.objects.filter(slug=request.data['slug']).exclude(id=category_id).exists():
            return Response(
                {'error': 'Category with this slug already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        category.slug = request.data['slug']
    if 'image' in request.FILES:
        category.image = request.FILES['image']
    if 'parent_id' in request.data:
        raw_parent_id = request.data.get('parent_id')
        if raw_parent_id in (None, '', 'null'):
            category.parent = None
        else:
            try:
                parent = Category.objects.get(id=int(raw_parent_id))
            except (ValueError, TypeError, Category.DoesNotExist):
                return Response(
                    {'error': 'Invalid parent category'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if parent.id == category.id:
                return Response(
                    {'error': 'A category cannot be its own parent'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prevent cycles: parent cannot be inside this category's subtree.
            cursor = parent
            while cursor is not None:
                if cursor.id == category.id:
                    return Response(
                        {'error': 'Invalid parent relationship (cycle detected)'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cursor = cursor.parent

            category.parent = parent
    
    category.save()
    
    return Response({
        'success': True,
        'message': 'Category updated successfully',
        'category': {
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'image': category.image.url if category.image else None,
            'parent_id': category.parent_id,
            'parent_name': category.parent.name if category.parent else None,
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_category(request, category_id):
    """Delete a product category."""
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if category has products
    if Product.objects.filter(category=category).exists():
        return Response(
            {'error': 'Cannot delete category with existing products'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    category_name = category.name
    category.delete()
    
    return Response({
        'success': True,
        'message': f'Category "{category_name}" deleted successfully'
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def get_all_orders(request):
    """Get all orders with filtering and pagination."""
    status_filter = request.query_params.get('status')
    ordering = request.query_params.get('ordering', '-created_at')
    
    orders = Order.objects.all()
    
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    orders = orders.order_by(ordering)
    
    return Response({
        'count': orders.count(),
        'orders': [
            {
                'id': order.id,
                'customer_name': order.customer.first_name or order.customer.username if order.customer else 'Unknown',
                'vendor_name': order.vendor.store_name if order.vendor else 'Unknown',
                'total_amount': float(order.total_amount) if order.total_amount else 0,
                'status': order.status,
                'payment_status': order.payment_status,
                'item_count': order.items.count(),
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'updated_at': order.updated_at.isoformat() if order.updated_at else None
            }
            for order in orders
        ]
    })
