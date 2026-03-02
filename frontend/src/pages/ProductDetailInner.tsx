import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: number;
  name: string;
  price: number | string;
  description: string;
  image: string;
  rating: number | string;
  vendor_name: string;
  vendor?: any;
  category_name: string;
  stock_quantity: number;
  shipping_fee?: number | string;
  variations?: any[];
}

const ProductDetailInner = ({ id }: { id?: string | undefined }) => {
  // Hooks: keep these in a stable order and unconditionally called
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [qty, setQty] = useState<number>(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | null>>({});
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState<boolean>(false);

  // Derive attribute options from product variations (useMemo is a hook; keep it in order)
  const attributeOptions = useMemo(() => {
    const acc: Record<string, Set<string>> = {};
    const variations = (product?.variations || []) as any[];
    variations.forEach((v) => {
      const attrs = v.attributes || {};
      Object.keys(attrs).forEach((k) => {
        if (!acc[k]) acc[k] = new Set();
        const val = attrs[k];
        if (val != null && val !== "") acc[k].add(String(val));
      });
    });
    return acc;
  }, [product]);

  // Fetch product on mount / id change and expose refetch on order completion
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Product>(`/products/${id}/`);
      if (!mountedRef.current) return;
      if (response.success && response.data) {
        setProduct(response.data);
        // initialize selectedAttributes keys based on available variation attributes
        const init: Record<string, string | null> = {};
        ((response.data as any).variations || []).forEach((v: any) => {
          const attrs = v.attributes || {};
          Object.keys(attrs).forEach((k) => {
            if (!(k in init)) init[k] = null;
          });
        });
        setSelectedAttributes(init);
      } else {
        toast.error("Product not found");
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to load product");
      setProduct(null);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Listen for completed orders and refetch product data to reflect stock changes
  useEffect(() => {
    const onOrdersPlaced = () => {
      fetchProduct();
    };
    window.addEventListener("orders:placed", onOrdersPlaced);
    return () => window.removeEventListener("orders:placed", onOrdersPlaced);
  }, [fetchProduct]);

  // Fetch related products from same category
  useEffect(() => {
    if (!product?.category_name) return;
    
    let mounted = true;
    const fetchRelatedProducts = async () => {
      setRelatedLoading(true);
      try {
        // Fetch products and filter by category, excluding current product
        const response = await api.get<any>('/products/');
        if (!mounted) return;
        
        if (response.success && Array.isArray(response.data)) {
          const related = response.data
            .filter((p: Product) => p.category_name === product.category_name && p.id !== product.id)
            .slice(0, 4); // Limit to 4 products
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      } finally {
        if (mounted) setRelatedLoading(false);
      }
    };
    
    fetchRelatedProducts();
    return () => {
      mounted = false;
    };
  }, [product?.category_name, product?.id]);

  // Update selectedVariation when selectedAttributes or product change
  useEffect(() => {
    if (!product) {
      setSelectedVariation(null);
      return;
    }
    const variations = product.variations || [];
    const selectedKeys = Object.keys(selectedAttributes || {}).filter((k) => selectedAttributes[k] != null);
    
    // If no attributes selected yet, don't match any variation
    if (selectedKeys.length === 0) {
      setSelectedVariation(null);
      return;
    }
    
    // Find a variation where ALL selected attributes match
    const found = variations.find((v: any) => {
      const attrs = v.attributes || {};
      return selectedKeys.every((k) => {
        const needed = selectedAttributes[k];
        const val = attrs[k];
        return String(val) === String(needed);
      });
    });
    setSelectedVariation(found || null);
  }, [selectedAttributes, product]);

  // Stable callbacks
  const selectAttribute = useCallback((attr: string, val: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attr]: prev[attr] === val ? null : val }));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    // require selecting a variation if present
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      toast.error("Please select product options");
      return;
    }
    
    // Check stock availability
    const availableStock = selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity;
    if (availableStock === 0) {
      toast.error("This product is currently out of stock");
      return;
    }
    if (qty > availableStock) {
      toast.error(`Only ${availableStock} item(s) available in stock`);
      return;
    }
    
    const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    const cartProduct: any = {
      id: selectedVariation ? `${product.id}-${selectedVariation.id}` : String(product.id),
      productId: product.id, // Store original product ID for API calls
      name: product.name + (selectedVariation ? ` (${selectedVariation.sku || ""})` : ""),
      price: selectedVariation && selectedVariation.price != null ? parseFloat(selectedVariation.price) : price,
      shipping_fee: typeof product.shipping_fee === "string" ? parseFloat(product.shipping_fee) : (product.shipping_fee || 0),
      image: product.image,
      rating: typeof product.rating === "string" ? parseFloat(product.rating) : product.rating,
      vendorName: product.vendor_name,
      vendor: product.vendor,
      category: product.category_name,
      description: product.description,
      stockQuantity: selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity,
      variation: selectedVariation ? selectedVariation : undefined,
    };
    addToCart(cartProduct, qty);
    toast.success("Added to cart!");
  }, [addToCart, product, qty, selectedVariation]);

  // Rendering guards (conditional UI) come AFTER hooks
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-foreground">Loading...</h1>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-foreground">Product not found</h1>
        <Link to="/products" className="text-primary hover:underline mt-4 inline-block">Back to products</Link>
      </div>
    );
  }

  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;
  const rating = typeof product.rating === "string" ? parseFloat(product.rating) : product.rating;
  const displayPrice = selectedVariation && selectedVariation.price != null ? parseFloat(selectedVariation.price) : price;
  
  // Display variation image if selected and available, otherwise use product image
  const displayImage = selectedVariation && selectedVariation.images && selectedVariation.images.length > 0
    ? selectedVariation.images[0].image
    : product.image;

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground">Shop</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {product.category_name} by {product.vendor_name}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="rounded-xl border border-border bg-card overflow-hidden aspect-square">
            <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-6 rounded-xl border border-border bg-card p-7">
            <div className="space-y-3 border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Customer rating</span>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-foreground">{formatPrice(displayPrice)}</div>
                {product.shipping_fee && Number(product.shipping_fee) > 0 && (
                  <div className="text-sm text-muted-foreground">
                    + {formatPrice(Number(product.shipping_fee))} shipping
                  </div>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              {product.stock_quantity === 0 && (
                <Badge variant="destructive" className="w-fit">
                  Out of Stock
                </Badge>
              )}
            </div>

            {product.variations && product.variations.length > 0 && (
              <div className="space-y-4 border-b border-border pb-6">
                {Object.keys(attributeOptions).map((attr) => {
                  const values = Array.from(attributeOptions[attr] || []);
                  return (
                    <div key={attr} className="space-y-2">
                      <h3 className="font-semibold text-foreground capitalize">{attr}</h3>
                      <div className="flex gap-3 flex-wrap">
                        {values.map((val) => {
                          const isSelected = selectedAttributes[attr] === val;
                          if (attr.toLowerCase() === "color") {
                            return (
                              <button
                                key={val}
                                onClick={() => selectAttribute(attr, val)}
                                title={String(val)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "ring-2 ring-primary" : ""}`}
                              style={{ backgroundColor: String(val).toLowerCase() === "white" ? undefined : String(val) }}
                            >
                                {String(val).toLowerCase() === "white" && <span className="w-6 h-6 block rounded-full bg-white border" />}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={val}
                              onClick={() => selectAttribute(attr, val)}
                              className={`px-3 py-2 rounded-lg border ${isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"} text-sm`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div>
                  {selectedVariation ? (
                    <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground space-y-1">
                      <div>
                        Selected: <span className="text-foreground font-medium">{selectedVariation.sku || Object.values(selectedVariation.attributes || {}).join(" / ")}</span>
                      </div>
                      <div>
                        Price: <span className="text-foreground font-semibold">{formatPrice(selectedVariation.price != null ? parseFloat(selectedVariation.price) : price)}</span>
                      </div>
                      <div>
                        Stock: <span className={`font-medium ${selectedVariation.stock_quantity === 0 ? "text-destructive" : "text-foreground"}`}>{selectedVariation.stock_quantity}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Please select product options to see price and stock.</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-muted transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 font-semibold text-lg w-12 text-center">{qty}</span>
                  <button 
                    onClick={() => {
                      const availableStock = selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity;
                      setQty(Math.min(qty + 1, availableStock));
                    }} 
                    disabled={
                      (selectedVariation && selectedVariation.stock_quantity === 0) ||
                      ((!product.variations || product.variations.length === 0) && product.stock_quantity === 0) ||
                      (selectedVariation && qty >= selectedVariation.stock_quantity) ||
                      ((!product.variations || product.variations.length === 0) && qty >= product.stock_quantity)
                    }
                    className="p-3 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Available: {selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity}
                </p>
              </div>

              <Button
                size="lg"
                className={`w-full rounded-lg h-12 font-semibold text-base ${
                  (selectedVariation && selectedVariation.stock_quantity === 0) ||
                  ((!product.variations || product.variations.length === 0) && product.stock_quantity === 0)
                    ? "bg-muted text-muted-foreground hover:bg-muted"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                onClick={handleAddToCart}
                disabled={
                  (product.variations && product.variations.length > 0 && !selectedVariation) ||
                  (selectedVariation && selectedVariation.stock_quantity === 0) ||
                  ((!product.variations || product.variations.length === 0) && product.stock_quantity === 0)
                }
              >
                {(selectedVariation && selectedVariation.stock_quantity === 0) ||
                ((!product.variations || product.variations.length === 0) && product.stock_quantity === 0) ? (
                  <>Out of Stock</>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" /> Add To Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="py-10">
          <div className="rounded-xl border border-border bg-card p-7">
          <div className="flex gap-8 mb-10 border-b border-border">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-4 font-bold transition-colors ${activeTab === "description" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-bold transition-colors ${activeTab === "reviews" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Reviews
            </button>
          </div>

          {activeTab === "description" ? (
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{product.description}</p>
              <p>Enjoy Shopping</p>
            </div>
          ) : (
            <div className="space-y-8">
              <ReviewForm
                productId={product.id}
                onReviewSubmitted={() => setReviewRefreshTrigger((prev) => prev + 1)}
              />

              <ReviewList productId={product.id} refreshTrigger={reviewRefreshTrigger} />
            </div>
          )}
          </div>
        </div>

        <div className="py-10 border-t border-border">
          <h2 className="text-3xl font-bold text-foreground mb-8">You May Also Like</h2>
          {relatedLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading recommendations...</p>
            </div>
          ) : relatedProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No other products in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailInner;
