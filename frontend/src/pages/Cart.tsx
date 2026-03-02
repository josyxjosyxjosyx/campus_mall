import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const shippingTotal = items.reduce((sum, item) => {
    const shipping = (item.product as any).shipping_fee ? Number((item.product as any).shipping_fee) : 0;
    return sum + shipping * item.quantity;
  }, 0);
  const grandTotal = totalPrice + shippingTotal;

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Shopping Cart is Empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Add some awesome products to your cart and proceed to checkout!</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 h-11">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>Cart</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Your Cart</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your items before secure checkout.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Price</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-foreground">Quantity</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-foreground">Total</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ product, quantity }) => (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <Link
                                to={`/products/${(product as any).productId || String(product.id).split("-")[0]}`}
                                className="font-semibold text-foreground hover:text-primary line-clamp-2 transition-colors"
                              >
                                {product.name}
                              </Link>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-foreground font-semibold">
                          {formatPrice(Number(product.price))}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center border border-border rounded-lg bg-background w-fit mx-auto">
                            <button 
                              onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))} 
                              className="p-2 hover:bg-muted transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 font-semibold text-sm min-w-12 text-center">{quantity}</span>
                            <button 
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  Math.min(quantity + 1, (product as any).stockQuantity || quantity + 1),
                                )
                              }
                              className="p-2 hover:bg-muted transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-foreground font-semibold">
                          {formatPrice(Number(product.price) * quantity)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => removeFromCart(product.id)} 
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-muted rounded-lg"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" asChild className="rounded-md">
                <Link to="/products">Continue Shopping</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-md"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8 sticky top-24 space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Cart Summary</h2>
              
              <div className="space-y-3 py-6 border-y border-border">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-foreground">{formatPrice(shippingTotal)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-bold text-primary text-2xl">{formatPrice(grandTotal)}</span>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-12 font-semibold"
                onClick={handleCheckout}
              >
                Proceed To Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
