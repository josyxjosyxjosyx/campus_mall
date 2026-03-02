"""
Serializers for user authentication and data validation.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.vendors.models import Vendor
from apps.products.models import Category
from .models import Address

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'role', 'is_active', 'is_approved', 'created_at')
        read_only_fields = ('id', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    # Vendor-specific fields
    store_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    selling_category_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'password', 'password2', 'role', 
                  'store_name', 'phone', 'address', 'description', 'selling_category_id')
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError(
                {'password': 'Password fields didn\'t match.'}
            )
        
        # Validate vendor fields if role is VENDOR
        if attrs.get('role') == 'VENDOR':
            if not attrs.get('store_name', '').strip():
                raise serializers.ValidationError(
                    {'store_name': 'Store name is required for vendors.'}
                )
            if not attrs.get('phone', '').strip():
                raise serializers.ValidationError(
                    {'phone': 'Phone number is required for vendors.'}
                )
            if not attrs.get('address', '').strip():
                raise serializers.ValidationError(
                    {'address': 'Address is required for vendors.'}
                )
            selling_category_id = attrs.get('selling_category_id')
            if not selling_category_id:
                raise serializers.ValidationError(
                    {'selling_category_id': 'Selling category is required for vendors.'}
                )
            if not Category.objects.filter(id=selling_category_id).exists():
                raise serializers.ValidationError(
                    {'selling_category_id': 'Invalid selling category.'}
                )
        
        return attrs
    
    def create(self, validated_data):
        # Extract vendor fields
        store_name = validated_data.pop('store_name', None)
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        description = validated_data.pop('description', None)
        selling_category_id = validated_data.pop('selling_category_id', None)
        role = validated_data.get('role', 'CUSTOMER')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            password=validated_data['password'],
            role=role,
            is_approved=False if role == 'VENDOR' else True  # Vendors need admin approval
        )
        
        # Create vendor profile if role is VENDOR
        if role == 'VENDOR':
            try:
                vendor = Vendor.objects.create(
                    user=user,
                    store_name=store_name,
                    phone=phone,
                    address=address,
                    description=description or '',
                    selling_category_id=selling_category_id
                )
                print(f"✓ Vendor profile created successfully for user {user.email}: {vendor.id}")
            except Exception as e:
                print(f"✗ Error creating vendor profile: {str(e)}")
                # If vendor creation fails, don't fail the registration
                # but we should at least skip it
                pass
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for customer addresses."""
    
    class Meta:
        model = Address
        fields = (
            'id', 'label', 'first_name', 'last_name', 'email', 'phone_number',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code',
            'country', 'is_default', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def validate_label(self, value):
        """Validate that label is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Label cannot be empty.")
        return value.strip()

