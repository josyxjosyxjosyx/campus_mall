import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProductCardProduct {
  id: number;
  name: string;
  price: number | string;
  image: string;
  rating: number | string;
  vendor_name?: string;
  vendorName?: string;
  variations?: any[];
  stock_quantity?: number;
}

const ProductCard = ({ product }: { product: ProductCardProduct }) => {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isCustomer = !user || user.role === 'CUSTOMER';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    // Convert API product to mockData format for cart
    const cartProduct = {
      id: String(product.id),
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      image: product.image,
      rating: typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating,
      vendorName: product.vendor_name || product.vendorName || 'Unknown Vendor',
      category: '',
      description: '',
      stockQuantity: 0,
    };
    addToCart(cartProduct);
    toast.success(`${product.name} added to cart`);
  };

  const vendorName = product.vendor_name || product.vendorName || 'Unknown Vendor';
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const rating = typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || user.role !== 'CUSTOMER') return;
      const res = await api.getWishlist();
      if (!res.success || !res.data) return;
      const items: any[] = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const found = items.find((it) => it.product && Number(it.product.id) === Number(product.id));
      if (mounted) {
        setWishlisted(!!found);
        setWishlistId(found ? found.id : null);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user, product.id]);

  return (
    <Link
      to={`/products/${product.id}`}
      className={`group block rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ${
        product.stock_quantity === 0 ? "" : "hover:-translate-y-1"
      }`}
    >
      <div className={`relative aspect-square overflow-hidden bg-muted/40 ${product.stock_quantity === 0 ? "opacity-60" : ""}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="text-[10px] font-medium">
            {vendorName}
          </Badge>
        </div>
        {/* Wishlist button (always show for customers) */}
        {isCustomer && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user || user.role !== 'CUSTOMER') return;
              if (wishlistLoading) return;
              setWishlistLoading(true);
              try {
                if (!wishlisted) {
                  const res = await api.addToWishlist(Number(product.id));
                  console.log('addToWishlist response', res);
                  if (res.success && res.data) {
                    setWishlisted(true);
                    setWishlistId((res.data as any).id || null);
                    toast.success('Added to wishlist');
                  } else {
                    toast.error(res.error || 'Could not add to wishlist');
                  }
                } else if (wishlistId) {
                  const res = await api.removeWishlist(wishlistId);
                  console.log('removeWishlist response', res);
                  if (res.success) {
                    setWishlisted(false);
                    setWishlistId(null);
                    toast.success('Removed from wishlist');
                  } else {
                    toast.error(res.error || 'Could not remove from wishlist');
                  }
                }
              } catch (err) {
                console.error('wishlist action error', err);
                toast.error('Wishlist action failed');
              } finally {
                setWishlistLoading(false);
              }
            }}
            className="absolute right-3 top-3 z-10 group"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${wishlisted ? 'bg-white border-primary/20' : 'bg-white border-primary'}`}>
                <Heart className={`h-4 w-4 transition-colors duration-200 ${wishlisted ? 'text-primary fill-primary' : 'text-primary'}`} />
              </div>
              <span className="ml-0 text-xs text-primary max-w-0 overflow-hidden transition-all duration-200 group-hover:max-w-[140px] whitespace-nowrap">
                {wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              </span>
            </div>
          </button>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="destructive" className="text-base">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.6rem]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent-foreground" />
            <span className="text-xs text-muted-foreground">{rating}</span>
          </div>
          <span className="text-lg font-bold text-foreground">{formatPrice(price)}</span>
        </div>
        <div className="pt-1">
          {product.stock_quantity === 0 ? (
            <Badge variant="destructive" className="w-full justify-center">Out of Stock</Badge>
          ) : (product.variations && product.variations.length > 0) ? (
            <div
              onClick={(e) => {
                e.preventDefault();
                navigate(`/products/${product.id}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/products/${product.id}`);
                }
              }}
              className="inline-flex w-full items-center justify-center h-9 px-3 rounded-md border border-border text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              View options
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              className="h-9 w-full hover:bg-primary hover:text-primary-foreground transition-colors rounded-md"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              Add to cart
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
