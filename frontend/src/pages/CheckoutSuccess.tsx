import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import api from "@/services/api";
import { toast } from "sonner";

/**
 * Shown after Paystack redirect with ?reference=...
 * Verifies the payment and clears cart on success.
 */
const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found.");
      return;
    }
    let mounted = true;
    (async () => {
      const res = await api.verifyPaystack(reference);
      if (!mounted) return;
      if (res.success && res.data?.verified) {
        setStatus("success");
        clearCart();
      } else {
        setStatus("error");
        setErrorMessage((res.data as any)?.error || res.error || "Verification failed.");
        toast.error("Payment verification failed.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reference, clearCart]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-md mx-auto p-8 text-center">
          <h1 className="text-xl font-bold text-destructive mb-2">Verification failed</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            View My Orders
          </Button>
          <Button variant="outline" onClick={() => navigate("/cart")} className="w-full mt-2">
            Back to Cart
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-md mx-auto p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your purchase. Your orders have been confirmed.
        </p>
        <div className="space-y-2">
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            View My Orders
          </Button>
          <Button variant="outline" onClick={() => navigate("/products")} className="w-full">
            Continue Shopping
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
