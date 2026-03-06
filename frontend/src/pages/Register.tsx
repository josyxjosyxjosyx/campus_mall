import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-4
};

const StrengthLabel = ({ score }: { score: number }) => {
  if (score <= 1) return <span className="text-sm text-red-600">Weak</span>;
  if (score === 2) return <span className="text-sm text-amber-600">Fair</span>;
  if (score === 3) return <span className="text-sm text-emerald-600">Good</span>;
  return <span className="text-sm text-emerald-700">Strong</span>;
};

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [vendorProfile, setVendorProfile] = useState({
    store_name: "",
    phone: "",
    address: "",
    description: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      // AuthContext.register expects a single `name` string as first_name
      const name = `${firstName.trim()} ${lastName.trim()}`;
      if (accountType === "BUSINESS") {
        const success = await register(name, email, password, "VENDOR", {
          store_name: vendorProfile.store_name,
          phone: vendorProfile.phone,
          address: vendorProfile.address,
          description: vendorProfile.description,
        });
        if (success) {
          toast.success("Business account created! Account pending verification.");
          navigate("/vendor-pending");
        } else {
          toast.error("Registration failed. Email may already be in use.");
        }
      } else {
        const success = await register(name, email, password, "CUSTOMER");
        if (success) {
          toast.success("Account created! Please log in to continue.");
          navigate("/login");
        } else {
          toast.error("Registration failed. Email may already be in use.");
        }
      }
    } catch (err) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const score = passwordStrength(password);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:block h-full">
            <img
              src="https://media.istockphoto.com/id/1448108142/photo/student-searching-for-a-book-in-the-library-system.jpg?s=1024x1024&w=is&k=20&c=7uis7hPw0AQCYLQDcJyomi4j4dWKnzgTJBOG2uQGB1Y="
              alt="Happy people shopping"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8">
            <div className="flex justify-center mb-4 md:justify-start">
              <img src="/logo.png" alt="Campus Mall" className="h-12 w-auto" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Create account</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign up to buy and sell on Campus Mall — it only takes a minute.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <Label>Account type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("PERSONAL")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountType === "PERSONAL" ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">Personal account</p>
                    <p className="text-xs text-muted-foreground">For shopping and bidding</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("BUSINESS")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountType === "BUSINESS" ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">Business account</p>
                    <p className="text-xs text-muted-foreground">Sell on Campus Mall and manage listings</p>
                  </button>
                </div>
              </div>

              {accountType === "BUSINESS" && (
                <div className="p-3 rounded-lg bg-muted/20 border border-border mb-3">
                  <p className="text-sm font-medium text-foreground mb-2">Business account details</p>
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Store / Business name *</Label>
                    <Input id="store_name" value={vendorProfile.store_name} onChange={(e) => setVendorProfile({ ...vendorProfile, store_name: e.target.value })} placeholder="Your store or company name" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="vendor_phone">Business phone *</Label>
                    <Input id="vendor_phone" value={vendorProfile.phone} onChange={(e) => setVendorProfile({ ...vendorProfile, phone: e.target.value })} placeholder="+1 (555) 123-4567" required disabled={isLoading} />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="vendor_address">Business address *</Label>
                    <Input id="vendor_address" value={vendorProfile.address} onChange={(e) => setVendorProfile({ ...vendorProfile, address: e.target.value })} placeholder="Street, City, State" required disabled={isLoading} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first">First name</Label>
                  <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last">Last name</Label>
                  <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required disabled={isLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" placeholder="+232 74 378 557" disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded overflow-hidden mt-2">
                      <div style={{ width: `${(score / 4) * 100}%` }} className={`h-full ${score <= 1 ? "bg-red-600" : score === 2 ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                    </div>
                  </div>
                  <div className="ml-3"><StrengthLabel score={score} /></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Use at least 8 characters, including numbers and symbols for a stronger password.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required disabled={isLoading} />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                disabled={
                  isLoading || !firstName.trim() || !lastName.trim() || !email.trim() || password.length < 8 ||
                  (accountType === "BUSINESS" && (!vendorProfile.store_name.trim() || !vendorProfile.phone.trim() || !vendorProfile.address.trim()))
                }
              >
                {isLoading ? "Creating account..." : accountType === "BUSINESS" ? "Create business account" : "Create account"}
              </Button>
            </form>

            <div className="flex justify-between items-center mt-4 text-sm">
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              <Link to="/contact" className="text-primary hover:underline">Need help?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
