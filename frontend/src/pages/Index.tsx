import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useEffect, useRef, useState } from "react";
import api from "@/services/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [justArrived, setJustArrived] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (!carouselRef.current) return;
    setCanScrollLeft(carouselRef.current.scrollLeft > 0);
    setCanScrollRight(
      carouselRef.current.scrollLeft <
        carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10
    );
  };

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollTo({
      left: carouselRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount),
      behavior: "smooth",
    });
    setTimeout(checkScroll, 280);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.getFeaturedProducts();
      if (!mounted) return;
      if (res.success && res.data) {
        const products = Array.isArray(res.data) ? res.data : [];
        setFeatured(products.slice(0, 8));
        setJustArrived(products.slice().reverse().slice(0, 8));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.request("/categories/");
        if (!mounted) return;
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    checkScroll();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [categories.length]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Curated Campus Essentials
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Shop Smart,
              <br />
              <span className="text-primary">Live Better</span> on Campus
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Discover premium everyday essentials from trusted student-focused vendors with a clean, seamless shopping flow.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-md px-6">
                <Link to="/products" className="inline-flex items-center gap-2">
                  Start Shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md px-6">
                <Link to="/register">Become a Vendor</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-lg font-semibold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground">Verified sellers</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-lg font-semibold text-foreground">10K+</p>
                <p className="text-xs text-muted-foreground">Products listed</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-lg font-semibold text-foreground">24/7</p>
                <p className="text-xs text-muted-foreground">Order support</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/20 p-5">
            <img
              src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1400&auto=format&fit=crop"
              alt="Campus shopping"
              className="h-full min-h-[320px] w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/20">
        <div className="container mx-auto grid gap-4 px-4 py-6 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Verified Marketplace</p>
              <p className="text-xs text-muted-foreground">Trusted vendors and secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Fast Campus Delivery</p>
              <p className="text-xs text-muted-foreground">Quick dispatch for eligible zones</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Curated Picks</p>
              <p className="text-xs text-muted-foreground">Fresh and trending products weekly</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
              <p className="text-sm text-muted-foreground">Browse focused collections for campus living.</p>
            </div>
            <div className="hidden gap-2 md:flex">
              <Button size="icon" variant="outline" onClick={() => scroll("left")} disabled={!canScrollLeft}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => scroll("right")} disabled={!canScrollRight}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-2">
            {categoriesLoading ? (
              <div className="py-8 text-sm text-muted-foreground">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">No categories available.</div>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.name}`}
                  className="group relative h-44 w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-card"
                >
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&auto=format&fit=crop"}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-sm uppercase tracking-wide text-white/80">Collection</p>
                    <p className="text-xl font-semibold">{cat.name}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-14">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Featured Products</h2>
              <p className="text-sm text-muted-foreground">Popular picks curated by campus shoppers.</p>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/products">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">Loading featured products...</div>
            ) : (
              featured.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Just Arrived</h2>
              <p className="text-sm text-muted-foreground">New additions from vendors across campus.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {justArrived.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">Loading latest arrivals...</div>
            ) : (
              justArrived.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

