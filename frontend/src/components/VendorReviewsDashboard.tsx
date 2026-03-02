import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Star } from "lucide-react";

interface ProductReview {
  id: number;
  product: {
    id: number;
    name: string;
  };
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  content: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

interface ProductWithReviews {
  id: number;
  name: string;
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

const VendorReviewsDashboard = () => {
  const [products, setProducts] = useState<ProductWithReviews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "rating">("recent");

  useEffect(() => {
    const fetchVendorReviews = async () => {
      setIsLoading(true);
      try {
        // Try to fetch vendor's own product reviews endpoint first
        let res = await api.get("/reviews/my_product_reviews/");
        
        // If that fails or returns empty, fall back to all approved reviews
        if (!res.success || !res.data) {
          res = await api.get("/reviews/");
        }

        if (res.success && res.data) {
          // Group reviews by product
          const productMap = new Map<number, ProductWithReviews>();

          res.data.forEach((review: ProductReview) => {
            const productId = review.product.id;
            if (!productMap.has(productId)) {
              productMap.set(productId, {
                id: productId,
                name: review.product.name,
                reviews: [],
                averageRating: 0,
                totalReviews: 0,
              });
            }

            const product = productMap.get(productId)!;
            product.reviews.push(review);
            product.totalReviews = product.reviews.length;
            product.averageRating =
              product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
          });

          setProducts(Array.from(productMap.values()).sort((a, b) => b.totalReviews - a.totalReviews));
        }
      } catch (error) {
        console.error("Error fetching vendor reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorReviews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading reviews...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border">
        <h2 className="text-xl font-semibold mb-2">No Reviews Yet</h2>
        <p className="text-gray-600">Your customers haven't left any reviews yet. Keep providing great products!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Products Reviewed</h3>
          <p className="text-3xl font-bold text-blue-600">{products.length}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Reviews</h3>
          <p className="text-3xl font-bold text-green-600">
            {products.reduce((sum, p) => sum + p.totalReviews, 0)}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Average Rating</h3>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-purple-600">
              {(
                products.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0) /
                products.reduce((sum, p) => sum + p.totalReviews, 0)
              ).toFixed(1)}
            </p>
            <div>{renderStars(Math.round((
              products.reduce((sum, p) => sum + p.averageRating * p.totalReviews, 0) /
              products.reduce((sum, p) => sum + p.totalReviews, 0)
            )))}</div>
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex gap-4 items-center flex-wrap bg-gray-50 p-4 rounded-lg border">
        <div>
          <label className="text-sm font-medium text-gray-700">Rating Filter:</label>
          <select
            value={selectedRating ?? ""}
            onChange={(e) => setSelectedRating(e.target.value ? Number(e.target.value) : null)}
            className="ml-2 px-3 py-1 border rounded bg-white"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Star{r !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "rating")}
            className="ml-2 px-3 py-1 border rounded bg-white"
          >
            <option value="recent">Most Recent</option>
            <option value="rating">High to Low Rating</option>
          </select>
        </div>
      </div>

      {/* Products & Reviews */}
      <div className="space-y-8">
        {products.map((product) => {
          // Filter reviews by selected rating
          const filteredReviews = selectedRating
            ? product.reviews.filter((r) => r.rating === selectedRating)
            : product.reviews;

          // Sort reviews
          const sortedReviews = [...filteredReviews].sort((a, b) => {
            if (sortBy === "recent") {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else {
              return b.rating - a.rating;
            }
          });

          if (selectedRating && filteredReviews.length === 0) return null;

          return (
            <div key={product.id} className="bg-white rounded-lg border overflow-hidden">
              {/* Product Header */}
              <div className="bg-gray-50 p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(product.averageRating))}
                        <span className="text-sm text-gray-600 ml-1">
                          {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Reviews */}
              <div className="divide-y">
                {sortedReviews.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No reviews for this product</div>
                ) : (
                  sortedReviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-sm font-semibold text-gray-900">
                              {review.customer_name}
                            </span>
                          </div>
                          {review.title && <p className="text-sm font-semibold text-gray-900 mt-1">{review.title}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
                          {review.is_verified_purchase && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 w-max ml-auto">
                              Verified Purchase
                            </div>
                          )}
                          {!review.is_approved && (
                            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1 w-max ml-auto">
                              Pending Approval
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                      <div className="text-xs text-gray-500 mt-3">{review.customer_email}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorReviewsDashboard;
