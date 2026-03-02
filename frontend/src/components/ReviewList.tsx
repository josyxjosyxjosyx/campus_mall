import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Star } from "lucide-react";

interface Review {
  id: number;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  content: string;
  is_verified_purchase: boolean;
  created_at: string;
}

interface ReviewListProps {
  productId: number;
  refreshTrigger?: number;
}

const ReviewList = ({ productId, refreshTrigger }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/reviews/by_product/?product_id=${productId}`);
        if (res.success && res.data) {
          setReviews(res.data);
          if (res.data.length > 0) {
            const avgRating =
              res.data.reduce((sum: number, r: Review) => sum + r.rating, 0) / res.data.length;
            setAverageRating(avgRating);
          } else {
            setAverageRating(0);
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [productId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
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
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No reviews yet. Be the first to review!</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Average Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <h3 className="font-semibold text-lg mb-3">Customer Reviews</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-primary">{averageRating.toFixed(1)}</div>
            <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
            <div className="text-sm text-gray-600 mt-1">{reviews.length} reviews</div>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-8 text-right">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-5 bg-white hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-base">{review.title || "Review"}</div>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-600">
                    {review.customer_name}
                    {review.is_verified_purchase && (
                      <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
