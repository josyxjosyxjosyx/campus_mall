import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Store, ChevronRight, ChevronLeft, Zap, Shield, Users, TrendingUp, Search, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useEffect, useState, useRef } from "react";
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkScroll = () => {
    if (carouselRef.current) {
      setCanScrollLeft(carouselRef.current.scrollLeft > 0);
      setCanScrollRight(
        carouselRef.current.scrollLeft < 
        carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10
      );
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = carouselRef.current.scrollLeft + 
        (direction === "right" ? scrollAmount : -scrollAmount);
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth"
      });
      setTimeout(checkScroll, 300);
    }
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
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.request('/categories/');
        if (!mounted) return;
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    checkScroll();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", checkScroll);
      return () => carousel.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pt-8 pb-20 md:py-32">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Campus Marketplace Pioneer</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                  Your <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Campus, Your</span> Market
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                  Discover trusted vendors selling everything for campus life. From fashion to housing, food to tech – all vetted and delivered to your door.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-xl hover:shadow-primary/40 rounded-xl px-8 py-6 font-semibold text-lg group">
                  <Link to="/products" className="flex items-center gap-3">
                    Explore Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-6 font-semibold text-lg border-2">
                  <Link to="/register">Sell on Campus Mall</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div>
                  <div className="text-3xl font-bold text-foreground">500+</div>
                  <p className="text-sm text-muted-foreground">Verified Vendors</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">10K+</div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">24/7</div>
                  <p className="text-sm text-muted-foreground">Customer Support</p>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden md:grid grid-cols-2 gap-4 auto-rows-max">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-accent p-1">
                <img src="https://images.unsplash.com/photo-1554062407-98eeb440d6a3?w=400&h=400&fit=crop" alt="Fashion" className="w-full h-64 object-cover rounded-xl" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-accent/20 bg-gradient-to-br from-accent to-primary p-1 mt-8">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop" alt="Electronics" className="w-full h-64 object-cover rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRUST SIGNALS ==================== */}
      <section className="bg-white dark:bg-slate-900/50 py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "100% Verified", desc: "All vendors thoroughly checked" },
              { icon: TrendingUp, title: "Best Prices", desc: "Competitive rates guaranteed" },
              { icon: Users, title: "50K+ Students", desc: "Join our growing community" },
              { icon: MapPin, title: "Campus Delivery", desc: "Fast, reliable shipping" }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED CATEGORIES ==================== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Shop by Category</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Everything you need for campus life, all in one place</p>
          </div>

          {/* Carousel */}
          <div className="relative">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="absolute -left-6 z-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg disabled:opacity-30 hover:shadow-xl transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700"
            >
              {categoriesLoading ? (
                <div className="text-center py-12 w-full text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 w-full text-muted-foreground">No categories</div>
              ) : (
                categories.map((cat, idx) => {
                  const fallbackImages = [
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1554062407-98eeb440d6a3?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1560572933-67f90a1d5f73?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop",
                  ];
                  const imageUrl = cat.image || fallbackImages[idx % fallbackImages.length];
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.name}`}
                      className="flex-shrink-0 group relative overflow-hidden rounded-2xl w-56 h-56 shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <img
                        src={imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                        <p className="text-sm text-slate-200 mt-1">Explore Collection</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="absolute -right-6 z-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg disabled:opacity-30 hover:shadow-xl transition-all"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED PRODUCTS ==================== */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">Trending Now</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">Popular Products</h2>
            </div>
            <Button asChild variant="outline" className="hidden md:flex gap-2 rounded-xl">
              <Link to="/products" className="text-lg">
                See All <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500">Loading amazing products...</div>
            ) : (
              featured.map((product) => (
                <div key={product.id} className="group">
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Button asChild size="lg" className="rounded-xl bg-primary">
              <Link to="/products">See All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE US ==================== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 dark:text-white mb-16">Why Students Choose Campus Mall</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Campus-Focused",
                desc: "Curated vendors selling everything students actually need, from dorm essentials to class notes"
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Subscribe to vendors and get items delivered to campus within 24-48 hours"
              },
              {
                icon: "💰",
                title: "Student Prices",
                desc: "Special discounts and student rates from verified campus vendors"
              },
              {
                icon: "🔒",
                title: "Safe & Secure",
                desc: "Every transaction protected with buyer protection and secure payment options"
              },
              {
                icon: "🤝",
                title: "Support Local",
                desc: "Directly support student entrepreneurs and small campus businesses"
              },
              {
                icon: "📱",
                title: "Easy to Use",
                desc: "Simple app and website designed with campus life in mind"
              }
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== RECENT ARRIVALS ==================== */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-6 w-6 text-accent" />
                <span className="text-sm font-semibold text-accent uppercase tracking-wide">Just Dropped</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">Fresh Arrivals</h2>
            </div>
            <Button asChild variant="outline" className="hidden md:flex gap-2 rounded-xl">
              <Link to="/products" className="text-lg">
                Discover More <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {justArrived.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500">Loading recent items...</div>
            ) : (
              justArrived.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ==================== VENDOR CTA ==================== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-accent/90 p-12 md:p-20 shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Sell?</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Join hundreds of campus vendors reaching thousands of students. Get started in minutes with our simple seller program.
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-slate-100 rounded-xl px-8 py-6 text-lg font-semibold">
                <Link to="/register" className="flex items-center gap-2">
                  Start Selling <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 dark:text-white mb-16">What Students Say</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                school: "Campus State University",
                text: "Found everything I needed for my dorm room in one place. Much better than searching around campus!"
              },
              {
                name: "Marcus T.",
                school: "Tech Institute",
                text: "As a vendor, Campus Mall has been amazing. My sales have tripled since joining. Highly recommended!"
              },
              {
                name: "Emma L.",
                school: "City College",
                text: "The 24-hour delivery is a lifesaver. Got my textbooks and supplies delivered right when I needed them."
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER CTA ==================== */}
      <section className="py-16 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Search className="h-12 w-12 mx-auto mb-6 text-primary opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Browse our full catalog or contact our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary rounded-xl">
                <Link to="/products">Browse All</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
