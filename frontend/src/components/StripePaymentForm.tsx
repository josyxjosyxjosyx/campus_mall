import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const stripePromiseCache: Record<string, Promise<any>> = {};

function getStripePromise(publishableKey: string) {
  if (!publishableKey) return null;
  if (!stripePromiseCache[publishableKey]) {
    stripePromiseCache[publishableKey] = loadStripe(publishableKey);
  }
  return stripePromiseCache[publishableKey];
}

function StripeConfirmForm({
  clientSecret,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      // Stripe requires elements.submit() to be called before confirmPayment()
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Validation failed");
        setLoading(false);
        return;
      }
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
          receipt_email: undefined,
        },
      });
      if (confirmError) {
        setError(confirmError.message || "Payment failed");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay now"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  publishableKey: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripePromise = getStripePromise(publishableKey);
  if (!stripePromise) {
    return (
      <div className="text-destructive">
        Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY or configure the backend.
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeConfirmForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}
