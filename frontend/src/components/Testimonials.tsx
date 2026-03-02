import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import api from "@/services/api";

interface Testimonial {
  id: number;
  author: string;
  title?: string;
  content: string;
  avatar_url?: string | null;
  rating?: number;
}

const Testimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const GAP = 16; // px gap between cards

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res: any = await api.getTestimonials();
      if (!mounted) return;
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const next = () => setIndex((i) => Math.min(i + 1, Math.max(0, items.length - 1)));

  // compute card width based on container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      let ratio = 0.82; // default for small screens
      if (w >= 1200) ratio = 0.48;
      else if (w >= 900) ratio = 0.6;
      else if (w >= 640) ratio = 0.7;
      const iw = Math.floor(w * ratio);
      setItemWidth(iw);
      // clamp index
      setIndex((ci) => Math.min(ci, Math.max(0, items.length - 1)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  // apply transform to track when index/itemWidth changes
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track || itemWidth === 0) return;
    const containerW = container.clientWidth;
    const offsetToCenter = Math.max(0, (containerW - itemWidth) / 2);
    const translateX = offsetToCenter + index * (itemWidth + GAP);
    track.style.transform = `translateX(-${translateX}px)`;
  }, [index, itemWidth]);

  if (!items || items.length === 0)
    return (
      <section className="bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="text-muted-foreground">No testimonials yet. Add some from the admin dashboard.</div>
        </div>
      </section>
    );

  return (
    <section className="relative bg-gradient-to-b from-background via-background to-primary/5 py-20 md:py-28 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block">
            <span className="inline-block bg-accent/20 text-accent-foreground px-4 py-1.5 rounded-full text-sm font-semibold">
              ⭐ CUSTOMER REVIEWS
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Loved by Customers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real experiences from real people who trust Campus Mall. Join thousands of satisfied shoppers.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Controls */}
          <div className="absolute -top-16 right-0 flex gap-2 z-20">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className={`p-3 rounded-full border border-border bg-card hover:bg-primary/10 transition-all duration-300 ${
                index === 0 ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:scale-110"
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className={`p-3 rounded-full border border-border bg-card hover:bg-primary/10 transition-all duration-300 ${
                index === items.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:scale-110"
              }`}
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Carousel Container */}
          <div className="flex items-center justify-center overflow-hidden py-6">
            <div ref={containerRef} className="relative w-full">
              <div
                ref={trackRef}
                style={{
                  display: "flex",
                  gap: `${GAP}px`,
                  transition: "transform 450ms cubic-bezier(0.2, 0.9, 0.3, 1)",
                }}
              >
              {items.map((it, i) => (
                <article
                  key={it.id}
                  role="group"
                  aria-roledescription="testimonial"
                  aria-label={`${i + 1} of ${items.length}`}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    flex: `0 0 ${itemWidth}px`,
                    boxShadow: "0 30px 80px rgba(78,215,241,0.12)",
                    background: "linear-gradient(180deg, rgba(12,14,30,0.6), rgba(10,12,25,0.55))",
                    border: "1px solid rgba(78,215,241,0.12)",
                    backdropFilter: "blur(8px)",
                    color: "#E6EDF3",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-3 px-2">
                    {it.avatar_url ? (
                      <img src={it.avatar_url} alt={it.author} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/40" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/10 flex items-center justify-center text-2xl text-primary">{it.author.charAt(0)}</div>
                    )}
                    <blockquote className="text-sm md:text-base italic break-words whitespace-normal" style={{ color: "rgba(230,237,243,0.95)" }}>“{it.content}”</blockquote>
                    <div className="mt-2">
                      <div className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{it.author}</div>
                      {it.title && <div className="text-xs text-primary/80">{it.title}</div>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-3 mt-10">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-8 h-2.5 bg-primary shadow-lg shadow-primary/50"
                    : "w-2.5 h-2.5 bg-border hover:bg-primary/50"
                }`}
              />
            ))}
          </div>

          {/* Results Counter */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{index + 1}</span> of{" "}
            <span className="font-semibold text-foreground">{items.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
