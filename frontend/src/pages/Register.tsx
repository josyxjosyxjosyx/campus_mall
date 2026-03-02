import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VendorProfile {
  store_name: string;
  phone: string;
  address: string;
  description: string;
  selling_category_id: string;
}

interface CategoryOption {
  id: number;
  name: string;
  parent?: number | null;
}

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [vendorProfile, setVendorProfile] = useState<VendorProfile>({
    store_name: "",
    phone: "",
    address: "",
    description: "",
    selling_category_id: "",
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000/api") + "/categories/");
      const data = await res.json().catch(() => []);
      const items = Array.isArray(data) ? data : data?.results || [];
      setCategories(items);
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (role === "VENDOR") {
      if (!vendorProfile.store_name.trim() || !vendorProfile.phone.trim() || !vendorProfile.address.trim() || !vendorProfile.selling_category_id) {
        toast.error("Please fill in all store details");
        return;
      }
    }

    setIsLoading(true);
    try {
      const success = await register(name, email, password, role, vendorProfile);
      if (success) {
        if (role === "VENDOR") {
          toast.success("Account created! Please log in to continue.");
        } else {
          toast.success("Account created! Please log in to continue.");
        }
        navigate("/login");
      } else {
        toast.error("Registration failed. Email may already be in use.");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: "CUSTOMER", label: "Customer", desc: "Browse & purchase products" },
    { value: "VENDOR", label: "Vendor", desc: "Sell your products" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Campus Mall" className="h-14 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Join Campus Mall today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === r.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
            </div>

            {/* Vendor Profile Fields */}
            {role === "VENDOR" && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-sm text-foreground">Vendor Profile Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name *</Label>
                  <Input
                    id="store_name"
                    value={vendorProfile.store_name}
                    onChange={(e) => setVendorProfile({ ...vendorProfile, store_name: e.target.value })}
                    placeholder="Your Store Name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={vendorProfile.phone}
                    onChange={(e) => setVendorProfile({ ...vendorProfile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={vendorProfile.address}
                    onChange={(e) => setVendorProfile({ ...vendorProfile, address: e.target.value })}
                    placeholder="Street, City, State, ZIP"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <textarea
                    id="description"
                    value={vendorProfile.description}
                    onChange={(e) => setVendorProfile({ ...vendorProfile, description: e.target.value })}
                    placeholder="Tell us about your store..."
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_category_id">Selling Category *</Label>
                  <select
                    id="selling_category_id"
                    value={vendorProfile.selling_category_id}
                    onChange={(e) => setVendorProfile({ ...vendorProfile, selling_category_id: e.target.value })}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
