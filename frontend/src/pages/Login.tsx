import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Clear old cached data on mount
  useEffect(() => {
    // This helps with the case where vendor was approved but old localStorage still had is_approved=false
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        // If they're logging in fresh here, they should get the latest data from the server
        // So we don't need to keep old cached data
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back!");
        navigate(result.role === "ADMIN" ? "/admin" : result.role === "VENDOR" ? "/vendor" : "/");
      } else {
        const errorMsg = result.error || "Invalid credentials";
        
        // Special handling for pending approval message
        if (errorMsg.toLowerCase().includes("pending")) {
          toast.error(errorMsg);
          // Show helpful message
          toast.info("If you recently registered as a vendor, your account is pending admin approval. Please check back later.");
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
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
          <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
