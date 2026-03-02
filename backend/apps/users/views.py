"""
Authentication views for login and registration.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, AddressSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from .models import Address

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint."""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(username=email, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if vendor is approved
        if user.role == 'VENDOR' and not user.is_approved:
            return Response(
                {'error': 'Your vendor account is pending admin approval. Please check back later.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,
                'role': user.role,
                'is_approved': user.is_approved
            }
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration endpoint."""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,
                'role': user.role,
                'is_approved': user.is_approved
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get or update the current user's profile."""
    user = request.user

    if request.method == "GET":
        serializer = UserSerializer(user)
        return Response({"success": True, "data": serializer.data})

    # PATCH - update allowed fields
    data = request.data
    changed = False
    if "name" in data:
        user.first_name = data.get("name") or ""
        changed = True
    if "email" in data:
        user.email = data.get("email") or user.email
        changed = True

    if changed:
        try:
            user.save()
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserSerializer(user)
    return Response({"success": True, "data": serializer.data})


class AddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customer addresses."""
    
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return addresses for the current user only."""
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create address for the current user."""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Update address, handling default address logic."""
        address = self.get_object()
        is_default = serializer.validated_data.get('is_default', address.is_default)
        
        # If setting this address as default, unset all other defaults
        if is_default and not address.is_default:
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        
        serializer.save()

