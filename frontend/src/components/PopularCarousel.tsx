import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categories as mockCategories, products as mockProducts, Category } from "@/data/mockData";

const PopularCarousel = ({ categories }: { categories?: Category[] }) => {
  const items = categories && categories.length ? categories : mockCategories;
  const productMap = new Map<string, string>();
  mockProducts.forEach((p) => {
    if (!productMap.has(p.category)) productMap.set(p.category, p.image);
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // transform-based navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [itemWidth, setItemWidth] = useState(240);

  // compute responsive itemsPerView and itemWidth
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSizes = () => {
      const w = el.clientWidth;
      let perView = 4;
      if (w < 640) perView = 1;
      else if (w < 900) perView = 2;
      else if (w < 1200) perView = 3;
      else perView = 4;
      setItemsPerView(perView);
      setItemWidth(Math.floor(w / perView));
      // clamp currentIndex when resizing
      const maxIndex = Math.max(0, items.length - perView);
      setCurrentIndex((ci) => Math.min(ci, maxIndex));
      setAtStart((ci) => (ci === 0 ? true : false));
      setAtEnd((ci) => (ci >= maxIndex ? true : false));
    };

    updateSizes();
    const ro = new ResizeObserver(updateSizes);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  const maxIndex = Math.max(0, items.length - itemsPerView);

  const go = (dir: "left" | "right") => {
    setCurrentIndex((ci) => {
      const next = dir === "right" ? Math.min(ci + 1, maxIndex) : Math.max(ci - 1, 0);
      setAtStart(next === 0);
      setAtEnd(next >= maxIndex);
      return next;
    });
  };

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Popular Categories</h2>
        <div className="flex items-center gap-3">
          <button
            aria-label="Previous"
            onClick={() => go("left")}
            aria-disabled={atStart}
            className={`p-2 rounded-full bg-[rgba(255,255,255,0.03)] border border-primary/10 shadow-md hover:scale-105 transition ${atStart ? "opacity-40 pointer-events-none" : "ring-2 ring-primary/10"}`}
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
          <button
            aria-label="Next"
            onClick={() => go("right")}
            aria-disabled={atEnd}
            className={`p-2 rounded-full bg-gradient-to-tr from-primary/10 to-secondary/5 border border-primary/20 shadow-md hover:scale-105 transition ${atEnd ? "opacity-40 pointer-events-none" : "ring-2 ring-primary/10"}`}
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Popular categories carousel"
        className="relative overflow-hidden"
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            transition: "transform 450ms cubic-bezier(.2,.9,.3,1)",
            transform: `translateX(-${currentIndex * itemWidth}px)`,
            width: `${items.length * itemWidth}px`,
            gap: "16px",
          }}
        >
          {items.map((cat) => (
            <a
              role="listitem"
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              style={{ flex: `0 0 ${itemWidth}px` }}
              className="rounded-2xl overflow-hidden bg-[rgba(255,255,255,0.03)] border border-primary/10 shadow-[0_8px_30px_rgba(78,215,241,0.06)] hover:shadow-[0_20px_60px_rgba(78,215,241,0.12)] transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              <div className="aspect-square w-full bg-slate-900 flex items-center justify-center relative">
                {productMap.has(cat.name) ? (
                  <img src={productMap.get(cat.name)} alt={cat.name} className="object-cover w-full h-full" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/70">{cat.name.charAt(0)}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent mix-blend-overlay" aria-hidden="true" />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-36 h-12 rounded-full bg-gradient-to-r from-primary/40 to-secondary/30 blur-sm opacity-60" aria-hidden="true" />
              </div>
              <div className="p-3 text-center bg-transparent backdrop-blur-md">
                <h3 className="font-semibold text-foreground truncate">{cat.name}</h3>
                <p className="text-xs text-primary/70 mt-1">Explore {cat.name.toLowerCase()}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCarousel;
