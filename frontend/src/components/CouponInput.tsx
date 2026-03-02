import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";

interface CouponInputProps {
  productIds?: number[];
  onChange?: (coupons: any[]) => void;
}

const CouponInput = ({ productIds = [], onChange }: CouponInputProps) => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [vendorCoupons, setVendorCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percentage: "",
    description: "",
    max_uses: "",
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
  });

  // Load vendor's coupons
  useEffect(() => {
    const loadCoupons = async () => {
      setIsLoading(true);
      try {
        const res = await api.getCoupons();
        if (res.success && res.data) {
          const payload: any = res.data;
          const items = Array.isArray(payload) ? payload : payload.results || [];
          setVendorCoupons(items);
        }
      } catch (error) {
        console.error("Failed to load coupons:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCoupons();
  }, []);

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount_percentage) {
      toast.error("Coupon code and discount percentage are required");
      return;
    }

    const discount = parseInt(newCoupon.discount_percentage);
    if (discount < 0 || discount > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }

    setIsLoading(true);
    try {
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        discount_percentage: discount,
        description: newCoupon.description,
        max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
        is_active: newCoupon.is_active,
        start_date: newCoupon.start_date || new Date().toISOString(),
        end_date: newCoupon.end_date ? new Date(newCoupon.end_date).toISOString() : null,
        products: productIds,
      };

      const res = await api.createCoupon(couponData);
      if (res.success) {
        toast.success(`Coupon "${newCoupon.code}" created successfully`);
        setVendorCoupons([...(vendorCoupons || []), res.data]);
        setNewCoupon({
          code: "",
          discount_percentage: "",
          description: "",
          max_uses: "",
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: "",
        });
        setShowNewCoupon(false);
      } else {
        toast.error(res.error || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCoupon = (coupon: any) => {
    if (coupons.find(c => c.id === coupon.id)) {
      // Remove if already selected
      const updated = coupons.filter(c => c.id !== coupon.id);
      setCoupons(updated);
      onChange?.(updated);
    } else {
      // Add if not selected
      const updated = [...coupons, coupon];
      setCoupons(updated);
      onChange?.(updated);
    }
  };

  const handleRemoveCoupon = (couponId: number) => {
    const updated = coupons.filter(c => c.id !== couponId);
    setCoupons(updated);
    onChange?.(updated);
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    setIsLoading(true);
    try {
      const res = await api.deleteCoupon(String(couponId));
      if (res.success) {
        toast.success("Coupon deleted successfully");
        setVendorCoupons(vendorCoupons.filter(c => c.id !== couponId));
        handleRemoveCoupon(couponId);
      } else {
        toast.error(res.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Coupons */}
      {coupons.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Applied Coupons</label>
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{coupon.code}</div>
                    <div className="text-sm text-gray-600">{coupon.discount_percentage}% off • {coupon.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCoupon(coupon.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Coupons */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Available Coupons</label>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {(vendorCoupons || []).map((coupon) => {
            const isSelected = coupons.some(c => c.id === coupon.id);
            return (
              <div
                key={coupon.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-blue-400"
                }`}
              >
                <div
                  onClick={() => handleSelectCoupon(coupon)}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{coupon.code}</div>
                    <div className="text-sm text-gray-600">
                      {coupon.discount_percentage}% off • Expires: {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : "Never"}
                    </div>
                    {coupon.description && <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCoupon(coupon.id);
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Coupon */}
      <Card className="p-4 border-dashed border-2 border-blue-300 bg-blue-50">
        {!showNewCoupon ? (
          <button
            onClick={() => setShowNewCoupon(true)}
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" /> Create New Coupon
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Create New Coupon</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Code (e.g., SAVE10)"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Discount %"
                min="0"
                max="100"
                value={newCoupon.discount_percentage}
                onChange={(e) => setNewCoupon({ ...newCoupon, discount_percentage: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              type="text"
              placeholder="Description (optional)"
              value={newCoupon.description}
              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Max uses (optional)"
                min="1"
                value={newCoupon.max_uses}
                onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newCoupon.end_date}
                onChange={(e) => setNewCoupon({ ...newCoupon, end_date: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddCoupon}
                disabled={isLoading}
                className="flex-1"
              >
                Create Coupon
              </Button>
              <Button
                onClick={() => setShowNewCoupon(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-500">
        Coupons can be applied to specific products or all your products. Select which coupons should apply to this product.
      </p>
    </div>
  );
};

export default CouponInput;
