import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { toast } from "sonner";

const Footer = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div>
            <img src="/logo.png" alt="Campus Mall" className="mb-4 h-10 w-auto" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              A modern campus marketplace with curated essentials and trusted local vendors.
            </p>
          </div>

          {(!user || user.role === "CUSTOMER") && (
            <div>
              <h4 className="mb-3 font-display font-semibold text-foreground">Shop</h4>
              <div className="space-y-2">
                <Link to="/products" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">All Products</Link>
                <Link to="/products?category=Electronics" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Electronics</Link>
                <Link to="/products?category=Clothing" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Clothing</Link>
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-3 font-display font-semibold text-foreground">Account</h4>
            <div className="space-y-2">
              {user ? (
                <>
                  <Link to="/profile" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Profile</Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="block w-full text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Login</Link>
                  <Link to="/register" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Register</Link>
                </>
              )}
            </div>
          </div>

          {!user && (
            <div>
              <h4 className="mb-3 font-display font-semibold text-foreground">Sell</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-sm text-muted-foreground transition-colors hover:text-foreground">Become a Vendor</Link>
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-3 font-display font-semibold text-foreground">Newsletter</h4>
            <p className="mb-4 text-xs text-muted-foreground">New arrivals and weekly offers.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Thank you for subscribing!");
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                placeholder="Your email"
                required
                className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <Button type="submit" className="h-auto rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground hover:bg-primary/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © 2026 Campus Mall. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
