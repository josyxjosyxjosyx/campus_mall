import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import { api } from "@/services/api";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: number;
  category_name: string;
  vendor: number;
  vendor_name: string;
  stock_quantity: number;
  rating: number;
  variations?: any[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeCategory = searchParams.get("category") || "All";
  const activeVendor = searchParams.get("vendor") || "All";
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("latest");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const categoriesResponse = await api.get<any>("/categories/?limit=1000");
        if (categoriesResponse.success && categoriesResponse.data) {
          const categoryData = Array.isArray(categoriesResponse.data)
            ? categoriesResponse.data
            : categoriesResponse.data.results || [];
          setCategories(categoryData);
        }

        const productsResponse = await api.get<any>("/products/?limit=10000");
        if (productsResponse.success && productsResponse.data) {
          const productData = Array.isArray(productsResponse.data)
            ? productsResponse.data
            : productsResponse.data.results || [];
          setProducts(productData);

          const attrs: Record<string, Set<string>> = {};
          (productData || []).forEach((p: any) => {
            (p.variations || []).forEach((v: any) => {
              const attributes = v.attributes || {};
              Object.keys(attributes).forEach((k) => {
                if (!attrs[k]) attrs[k] = new Set();
                const val = attributes[k];
                if (val != null && val !== "") attrs[k].add(String(val));
              });
            });
          });
          const seeded: Record<string, Set<string>> = {};
          Object.keys(attrs).forEach((k) => (seeded[k] = new Set()));
          setSelectedFilters(seeded);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const variationOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    (products || []).forEach((p: any) => {
      (p.variations || []).forEach((v: any) => {
        const attributes = v.attributes || {};
        Object.keys(attributes).forEach((k) => {
          const val = attributes[k];
          if (val == null || val === "") return;
          if (!opts[k]) opts[k] = [];
          const s = String(val);
          if (!opts[k].includes(s)) opts[k].push(s);
        });
      });
    });
    Object.keys(opts).forEach((k) => opts[k].sort());
    return opts;
  }, [products]);

  const vendorOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        (products || [])
          .map((p) => p.vendor_name)
          .filter((name): name is string => Boolean(name && String(name).trim()))
      )
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const syncFiltersToUrl = (filters: Record<string, Set<string>>) => {
    const params = new URLSearchParams(searchParams);
    Array.from(params.keys()).forEach((k) => {
      if (k.startsWith("f_")) params.delete(k);
    });
    Object.entries(filters).forEach(([attr, set]) => {
      if (set && set.size > 0) {
        params.set(`f_${attr}`, Array.from(set).join(","));
      }
    });
    setSearchParams(params);
  };

  const toggleFilter = (attr: string, val: string) => {
    setSelectedFilters((prev) => {
      const next: Record<string, Set<string>> = {};
      Object.entries(prev || {}).forEach(([k, s]) => (next[k] = new Set(Array.from(s))));
      if (!next[attr]) next[attr] = new Set();
      if (next[attr].has(val)) next[attr].delete(val);
      else next[attr].add(val);
      syncFiltersToUrl(next);
      return next;
    });
  };

  const clearFilters = () => {
    const seeded: Record<string, Set<string>> = {};
    Object.keys(variationOptions).forEach((k) => (seeded[k] = new Set()));
    setSelectedFilters(seeded);
    const params = new URLSearchParams(searchParams);
    Array.from(params.keys()).forEach((k) => {
      if (k.startsWith("f_")) params.delete(k);
    });
    setSearchParams(params);
  };

  useEffect(() => {
    if (!variationOptions || Object.keys(variationOptions).length === 0) return;
    const next: Record<string, Set<string>> = {};
    Object.keys(variationOptions).forEach((k) => (next[k] = new Set()));
    Array.from(searchParams.entries()).forEach(([key, val]) => {
      if (key.startsWith("f_")) {
        const attr = key.replace(/^f_/, "");
        const parts = String(val)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!next[attr]) next[attr] = new Set();
        parts.forEach((p) => next[attr].add(p));
      }
    });
    setSelectedFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variationOptions]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category_name === activeCategory;
      const matchesVendor = activeVendor === "All" || p.vendor_name === activeVendor;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const q = search.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.vendor_name && p.vendor_name.toLowerCase().includes(q));
      let matchesVariations = true;
      const filterKeys = Object.keys(selectedFilters || {});
      for (const key of filterKeys) {
        const selected = selectedFilters[key];
        if (selected && selected.size > 0) {
          const hasMatch = (p.variations || []).some((v: any) => {
            const val = v.attributes?.[key];
            if (val == null) return false;
            return selected.has(String(val));
          });
          if (!hasMatch) {
            matchesVariations = false;
            break;
          }
        }
      }

      return matchesCategory && matchesVendor && matchesPrice && matchesSearch && matchesVariations;
    });

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [activeCategory, activeVendor, search, products, priceRange, sortBy, selectedFilters]);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold text-foreground">Shop</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse curated products with precise filters and clean navigation.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Price Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min="0"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                  }}
                  placeholder="Min"
                />
                <Input
                  type="number"
                  min="0"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1000;
                    if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                  }}
                  placeholder="Max"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">${priceRange[0]} - ${priceRange[1]}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Attributes
                </h3>
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear
                </button>
              </div>
              {Object.keys(variationOptions).length === 0 ? (
                <p className="text-sm text-muted-foreground">No attribute filters available.</p>
              ) : (
                Object.entries(variationOptions).map(([attr, values]) => (
                  <div key={attr} className="mb-4">
                    <p className="mb-2 text-sm font-medium capitalize text-foreground">{attr}</p>
                    <div className="space-y-2">
                      {values.map((val) => (
                        <label key={val} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={!!(selectedFilters[attr] && selectedFilters[attr].has(val))}
                            onChange={() => toggleFilter(attr, val)}
                            className="h-4 w-4 rounded border-border"
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearch(val);
                    const params: Record<string, string> = {};
                    if (activeCategory !== "All") params.category = activeCategory;
                    if (activeVendor !== "All") params.vendor = activeVendor;
                    if (val.trim()) params.q = val;
                    setSearchParams(params);
                  }}
                  className="pl-10"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground"
              >
                <option value="latest">Sort: Latest</option>
                <option value="price-low">Sort: Price Low to High</option>
                <option value="price-high">Sort: Price High to Low</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {["All", ...categories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const params: Record<string, string> = {};
                    if (cat !== "All") params.category = cat;
                    if (activeVendor !== "All") params.vendor = activeVendor;
                    if (search.trim()) params.q = search.trim();
                    setSearchParams(params);
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Browse By Vendor
              </label>
              <select
                value={activeVendor}
                onChange={(e) => {
                  const selectedVendor = e.target.value;
                  const params: Record<string, string> = {};
                  if (activeCategory !== "All") params.category = activeCategory;
                  if (selectedVendor !== "All") params.vendor = selectedVendor;
                  if (search.trim()) params.q = search.trim();
                  setSearchParams(params);
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="All">All Vendors</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> products
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card py-14 text-center">
                <p className="text-lg text-muted-foreground">No products found.</p>
                <p className="mt-1 text-sm text-muted-foreground">Adjust filters or search query.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
