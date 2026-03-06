import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LoginPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const email = (location.state as any)?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Missing email; please start again.");
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back!");
        // navigate based on role stored by login
        navigate("/");
      } else {
        toast.error(result.error || "Invalid credentials");
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
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
          <p className="text-sm text-muted-foreground text-center mb-2">Signed in as <strong>{email}</strong></p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="flex justify-between items-center mt-4 text-sm">
            <Link to="/contact" className="text-muted-foreground hover:underline">Need help?</Link>
            <Link to="/register" className="text-primary hover:underline font-medium">Create your account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPassword;
