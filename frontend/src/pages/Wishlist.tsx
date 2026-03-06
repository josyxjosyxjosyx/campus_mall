import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";

const Wishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const res = await api.getWishlist();
      setLoading(false);
      if (!res.success || !res.data) return;
      const payload: any = res.data;
      const list = Array.isArray(payload) ? payload : payload.results || [];
      setItems(list);
    };
    load();
  }, [user]);

  const handleRemove = async (id: number) => {
    const res = await api.removeWishlist(id);
    if (res.success) setItems((s) => s.filter((it) => it.id !== id));
  };

  if (!user) return <div className="container mx-auto p-6">Please log in to view your wishlist.</div>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Wishlist</h2>
      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p className="text-muted-foreground">No items in your wishlist yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map((it) => (
          <div key={it.id} className="relative">
            {it.product ? <ProductCard product={it.product} /> : null}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleRemove(it.id);
              }}
              className="absolute top-2 left-2 bg-white/90 rounded px-2 py-1 text-sm border"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
