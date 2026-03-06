import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LoginEmail = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setIsLoading(true);
    try {
      const res = await api.post("/auth/check_email/", { email });
      if (res.success && res.data && (res.data as any).exists) {
        // proceed to password step and pass along email
        navigate("/login/password", { state: { email, user: (res.data as any).user } });
      } else {
        // backend returns 404 for not found; map result.error or data
        toast.error(((res.data as any)?.message) || res.error || "We cannot find an account with that email.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Unable to check email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Campus Mall" className="h-14 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">Sign in</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Enter your email to continue</p>

          <form onSubmit={handleContinue} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" disabled={isLoading}>
              {isLoading ? "Continuing..." : "Continue"}
            </Button>
          </form>

          <div className="mt-6 text-sm flex justify-between">
            <Link to="/contact" className="text-primary hover:underline">Need help?</Link>
            <Link to="/register" className="text-primary hover:underline font-medium">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginEmail;
