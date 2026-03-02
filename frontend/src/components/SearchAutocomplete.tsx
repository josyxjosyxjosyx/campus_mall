import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/services/api";

interface ProductSuggestion {
  id: number;
  name: string;
  category_name?: string;
}

interface CategorySuggestion {
  id: number;
  name: string;
}

const SearchAutocomplete = ({ placeholder = "Search products or categories..." }: { placeholder?: string }) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductSuggestion[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // fetch categories once and cache
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.get<any>("/categories/?limit=1000");
      if (mounted && res.success && res.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setCategories(data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debounced search for products
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!query.trim()) {
      setProducts([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    timerRef.current = window.setTimeout(async () => {
      const q = query.trim();
      const res = await api.get<any>(`/products/?search=${encodeURIComponent(q)}&limit=6`);
      if (res.success && res.data) {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setProducts(data.map((p: any) => ({ id: p.id, name: p.name, category_name: p.category_name })));
      } else {
        setProducts([]);
      }
      setOpen(true);
      setActiveIndex(-1);
    }, 300);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query]);

  // click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleSelectProduct = (id: number) => {
    setOpen(false);
    setQuery("");
    navigate(`/products/${id}`);
  };

  const handleSelectCategory = (name: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/products?category=${encodeURIComponent(name)}`);
  };

  const suggestions = [
    ...products.map((p) => ({ type: 'product' as const, id: p.id, label: p.name, meta: p.category_name })),
    ...categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6).map((c) => ({ type: 'category' as const, id: c.id, label: c.name })),
  ].slice(0, 8);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          aria-label="Search products or categories"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (products.length || query.trim()) setOpen(true); }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (activeIndex >= 0 && suggestions[activeIndex]) {
                const s = suggestions[activeIndex];
                if (s.type === 'product') handleSelectProduct(s.id as number);
                else handleSelectCategory(s.label);
              } else {
                // fallback to search results page
                const q = query.trim();
                if (q.length) navigate(`/products?q=${encodeURIComponent(q)}`);
                else navigate('/products');
                setOpen(false);
                setQuery("");
              }
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-transparent text-sm"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.type}-${s.id ?? s.label}-${idx}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { if (s.type === 'product') handleSelectProduct(s.id as number); else handleSelectCategory(s.label); }}
              className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${idx === activeIndex ? 'bg-muted' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.type === 'product' ? (s.meta || '') : 'Category'}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
