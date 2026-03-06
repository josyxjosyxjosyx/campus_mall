import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, ChevronDown, Settings, Globe, Search, Heart } from "lucide-react";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useAuth } from "@/context/AuthContext";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/ProfileEditor";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000/api") + "/categories/");
        const data = await res.json().catch(() => []);
        const items = Array.isArray(data) ? data : data?.results || [];
        setCategories(items.map((c: any) => c.name || c));
      } catch (e) {
        // ignore
      }
    };
    load();
    // load wishlist count via API helper (handles auth)
    const loadWishlistCount = async () => {
      try {
        const res = await (await import('@/services/api')).api.getWishlist();
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : res.data.results || [];
          setWishlistCount(items.length || 0);
        }
      } catch (e) {
        // ignore
      }
    };
    loadWishlistCount();
  }, []);

  const dashboardPath = user?.role === "ADMIN" ? "/admin" : user?.role === "VENDOR" ? "/vendor" : "/dashboard";

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="border-b border-border/60 bg-muted/30">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs text-muted-foreground">
          <p>Premium Campus Shopping Experience</p>
          <p className="hidden md:block">Free delivery on selected campus zones</p>
        </div>
      </div>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Campus Mall" className="h-11 w-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {(!user || user.role === "CUSTOMER") && (
            <>
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link to="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </>
          )}
        </nav>

        {/* Search (desktop) - compact, expands on hover (customers only) */}
        {(!user || user.role === "CUSTOMER") && (
          <div className="hidden md:flex items-center flex-1 justify-center px-6">
            <div className="flex items-center">
              <div className="overflow-hidden w-[60px] h-[60px] hover:w-[270px] transition-[width] duration-300 rounded-full shadow-md">
                <div className="flex items-center h-full">
                  <div className="w-[60px] h-[60px] flex items-center justify-center bg-primary text-white rounded-full flex-shrink-0">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="flex-1 pl-3 pr-3 bg-white rounded-r-full h-full flex items-center">
                    <div className="w-full">
                      <SearchAutocomplete className="w-full" category={selectedCategory} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-3">
          {/* Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
            >
              <Globe className="h-4 w-4" />
              <span>{currency}</span>
              <ChevronDown className="h-4 w-4 transition-transform" style={{ transform: currencyOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>

            {currencyOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-lg z-40 animate-fade-in">
                <div className="py-1">
                  {(['USD', 'GBP', 'SLE'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setCurrency(curr);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                        currency === curr
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(!user || user.role === "CUSTOMER") && (
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          {(!user || user.role === "CUSTOMER") && (
            <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Heart className="h-6 w-6 text-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Profile Dropdown with Dashboard entry for all authenticated users */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name || user?.email}</span>
                  <ChevronDown className="h-4 w-4 transition-transform" style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-40 animate-fade-in">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate(dashboardPath);
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      >
                        <User className="h-4 w-4" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileEditor(true);
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                      >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                <User className="h-4 w-4 mr-1" />
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

        {/* Mobile Nav */}
        {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3 animate-fade-in">
          {/* Currency Selector in Mobile */}
          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Currency</p>
            <div className="flex gap-2">
              {(['USD', 'GBP', 'SLE'] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrency(curr);
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currency === curr
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {(!user || user.role === "CUSTOMER") && (
            <>
              <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Home</Link>
              <Link to="/products" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Shop</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Contact</Link>
            </>
          )}
          {(!user || user.role === "CUSTOMER") && (
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Cart ({totalItems})</Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Dashboard</Link>
              <button
                onClick={() => {
                  setShowProfileEditor(true);
                  setMobileOpen(false);
                }}
                className="block text-sm font-medium py-2 text-primary"
              >
                Edit Profile
              </button>
              <button onClick={() => { logout(); navigate("/"); setMobileOpen(false); }} className="block text-sm font-medium py-2 text-destructive">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Register</Link>
            </>
          )}
        </div>
      )}
    </header>

    {/* Profile Editor Modal */}
    <ProfileEditor isOpen={showProfileEditor} onClose={() => setShowProfileEditor(false)} />
    </>
  );
};

export default Navbar;
