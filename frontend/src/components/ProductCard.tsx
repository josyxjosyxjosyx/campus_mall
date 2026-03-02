import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
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
