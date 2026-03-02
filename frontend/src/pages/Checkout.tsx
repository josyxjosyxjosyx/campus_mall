import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import api from "@/services/api";
import StripePaymentForm from "@/components/StripePaymentForm";

interface Address {
  id: number;
  label: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [stripeStep, setStripeStep] = useState<"form" | "stripe">("form");
  const [stripeClientSecret, setStripeClientSecret] = useState<string>("");
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    shippingAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    paymentMethod: "STRIPE",
  });

  const handleAddressSelect = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      firstName: address.first_name,
      lastName: address.last_name,
      email: address.email,
      phoneNumber: address.phone_number,
      shippingAddress: address.address_line1,
      addressLine2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
    }));
  };

  const handledRedirect = useRef(false);
  useEffect(() => {
    const status = searchParams.get("redirect_status");
    if (status === "succeeded" && !handledRedirect.current) {
      handledRedirect.current = true;
      clearCart();
      setOrderPlaced(true);
    }
  }, [searchParams, clearCart]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await api.getAddresses();
        if (response.success && response.data) {
          const addressList = Array.isArray(response.data)
            ? response.data
            : (response.data as any)?.results || [];
          setSavedAddresses(addressList);

          const defaultAddress = addressList.find((addr) => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            handleAddressSelect(defaultAddress);
          }
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
    };
    fetchAddresses();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Login Required</p>
          <p className="text-sm text-muted-foreground mb-6">Please sign in to continue checkout.</p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mb-6">Add products before checkout.</p>
          <Button onClick={() => navigate("/products")} className="w-full">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const buildOrdersByVendor = async (): Promise<{ fullAddress: string; ordersPayload: any[] } | null> => {
    if (!formData.shippingAddress || !formData.city || !formData.postalCode || !formData.country) {
      alert("Please fill in all shipping information");
      return null;
    }

    for (const item of items) {
      const availableStock = (item.product as any).stockQuantity || 0;
      if (item.quantity > availableStock) {
        alert(`${item.product.name}: Only ${availableStock} item(s) available in stock. You have ${item.quantity} in cart.`);
        return null;
      }
    }

    const fullAddress = `${formData.shippingAddress}, ${formData.city}, ${formData.postalCode}, ${formData.country}`;
    const byVendor: Record<string, any[]> = {};

    for (const item of items) {
      let vendorId = (item.product as any).vendor ?? (item.product as any).vendorId;
      if (!vendorId) {
        try {
          const idToFetch = (item.product as any).productId || item.product.id;
          const res = await api.getProduct(String(idToFetch));
          if (res.success && (res.data as any)?.vendor) {
            vendorId = (res.data as any).vendor;
            (item.product as any).vendor = vendorId;
          }
        } catch (err) {
          console.error("[CHECKOUT] Failed to fetch product vendor:", err);
        }
      }
      if (!vendorId) {
        alert(`Error: Product "${item.product.name}" is missing vendor information. Please refresh and try again.`);
        return null;
      }

      const key = String(vendorId);
      if (!byVendor[key]) byVendor[key] = [];
      byVendor[key].push(item);
    }

    const ordersPayload = Object.entries(byVendor).map(([vendorKey, vendorItems]) => {
      const vendorId = Number(vendorKey);
      const totalAmount = vendorItems.reduce((s, it) => s + Number(it.product.price) * it.quantity, 0);
      return {
        vendor_id: vendorId,
        total_amount: totalAmount,
        payment_method: formData.paymentMethod,
        shipping_address: fullAddress,
        items: vendorItems.map((it) => ({
          productId: (it.product as any).productId || it.product.id,
          variationId: (it.product as any).variation?.id || null,
          quantity: it.quantity,
          price: Number(it.product.price),
        })),
      };
    });

    return { fullAddress, ordersPayload };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const built = await buildOrdersByVendor();
      if (!built) {
        setLoading(false);
        return;
      }
      const { ordersPayload } = built;

      if (formData.paymentMethod === "STRIPE") {
        const res = await api.createStripeIntent({
          customer_email: user?.email || "",
          orders: ordersPayload,
        });
        if (!res.success) {
          alert(res.error || "Failed to initialize Stripe payment.");
          setLoading(false);
          return;
        }
        const data = res.data as { client_secret: string; stripe_publishable_key?: string };
        setStripeClientSecret(data.client_secret);
        setStripePublishableKey(data.stripe_publishable_key || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");
        setStripeStep("stripe");
        setLoading(false);
        return;
      }

      if (formData.paymentMethod === "PAYSTACK") {
        const callbackUrl = `${window.location.origin}/checkout/success`;
        const res = await api.createPaystackInitialize({
          customer_email: user?.email || "",
          callback_url: callbackUrl,
          orders: ordersPayload,
        });
        if (!res.success) {
          alert(res.error || "Failed to initialize Paystack payment.");
          setLoading(false);
          return;
        }
        const data = res.data as { authorization_url: string };
        window.location.href = data.authorization_url;
        return;
      }

      let hasErrors = false;
      for (const orderPayload of ordersPayload) {
        const res = await api.createOrder(orderPayload);
        if (!res.success) {
          hasErrors = true;
          alert(res.error || "Order submission failed.");
          break;
        }
      }
      if (hasErrors) {
        setLoading(false);
        return;
      }

      if (saveAddressForFuture && !selectedAddressId) {
        try {
          await api.createAddress({
            label: `Address (${new Date().toLocaleDateString()})`,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            address_line1: formData.shippingAddress,
            address_line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: formData.country,
          });
        } catch (error) {
          console.error("Failed to save address:", error);
        }
      }

      try {
        window.dispatchEvent(new Event("orders:placed"));
      } catch {
      }
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      console.error("[CHECKOUT] Unexpected error:", error);
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : "Please try again"}`);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-md w-full border-2 border-primary/20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. Your order has been received and you can track it in your dashboard.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-11"
            >
              View My Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/products")}
              className="w-full rounded-lg h-11"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shippingTotal = items.reduce((sum, i) => {
    const shipping = (i.product as any).shipping_fee ? Number((i.product as any).shipping_fee) : 0;
    return sum + shipping * i.quantity;
  }, 0);
  const grandTotal = subtotal + shippingTotal;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span>Checkout</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Checkout</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm shipping details and complete payment securely.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {stripeStep === "stripe" && stripeClientSecret ? (
              <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Payment Information</h2>
                <StripePaymentForm
                  clientSecret={stripeClientSecret}
                  publishableKey={stripePublishableKey}
                  onSuccess={() => {
                    setOrderPlaced(true);
                    clearCart();
                  }}
                  onBack={() => {
                    setStripeStep("form");
                    setStripeClientSecret("");
                  }}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Shipping Address</h2>

                  {savedAddresses.length > 0 && (
                    <div className="mb-8 pb-8 border-b border-border">
                      <h3 className="font-semibold text-foreground mb-4">Select From Your Saved Addresses</h3>
                      <div className="space-y-3">
                        {savedAddresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="saved-address"
                              checked={selectedAddressId === address.id}
                              onChange={() => {
                                setSelectedAddressId(address.id);
                                handleAddressSelect(address);
                              }}
                              className="mt-1 mr-3 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-foreground">{address.label}</span>
                                {address.is_default && (
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {address.first_name} {address.last_name}
                              </p>
                              <p className="text-sm text-foreground">{address.address_line1}</p>
                              {address.address_line2 && (
                                <p className="text-sm text-foreground">{address.address_line2}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.state} {address.postal_code}, {address.country}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {savedAddresses.length === 0 && (
                    <div className="mb-8 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                      No saved addresses yet. Add one from{" "}
                      <Link to="/addresses" className="text-primary hover:underline">Address Book</Link>
                      {" "}or enter a new address below.
                    </div>
                  )}

                  <h3 className="font-semibold text-foreground mb-4">
                    {selectedAddressId ? "Or Enter a Different Address" : "Enter Your Address"}
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">First Name</label>
                        <Input
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Last Name</label>
                        <Input
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">E-mail</label>
                        <Input
                          type="email"
                          placeholder="E-mail"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mobile No</label>
                        <Input
                          placeholder="Mobile No"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Address Line 1</label>
                      <Input
                        placeholder="Address Line 1"
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        className="h-11 bg-background border-border"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Address Line 2</label>
                      <Input
                        placeholder="Address Line 2"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        className="h-11 bg-background border-border"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
                        <Input
                          placeholder="Country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">City</label>
                        <Input
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">State</label>
                        <Input
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="h-11 bg-background border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">ZIP Code</label>
                        <Input
                          placeholder="ZIP Code"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="h-11 bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border cursor-pointer"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">Save this address for future purchases</span>
                    </label>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Payment</h2>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="STRIPE"
                      checked={formData.paymentMethod === "STRIPE"}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-foreground font-medium">Stripe</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-12 font-semibold text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8 sticky top-24 space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Order Total</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const shipping = (item.product as any).shipping_fee ? Number((item.product as any).shipping_fee) : 0;
                  const itemPrice = Number(item.product.price);
                  return (
                    <div key={item.product.id} className="flex justify-between text-sm pb-3 border-b border-border last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatPrice(itemPrice + shipping)}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatPrice((itemPrice + shipping) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 py-6 border-t border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-foreground">{formatPrice(shippingTotal)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-bold text-2xl text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
