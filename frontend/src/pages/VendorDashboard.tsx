import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ShoppingBag, TrendingUp, Store, Settings, Package, Star, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { api } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import VendorReviewsDashboard from "@/components/VendorReviewsDashboard";

const VendorDashboard = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [vendorStats, setVendorStats] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "reviews" | "stock">("products");
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>("");

  const fetchVendorProducts = async () => {
    try {
      const res = await api.get<any>("/products/my_products/");
      if (res.success && res.data) {
        const products = Array.isArray(res.data) ? res.data : res.data.results || [];
        setVendorProducts(products);
      } else {
        setVendorProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setVendorProducts([]);
    }
  };

  useEffect(() => { if (user?.id) fetchVendorProducts(); }, [user?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.getMyStore();
      if (res.success && res.data) setVendorStats(res.data);
    };
    if (user?.id) fetchStats();
  }, [user?.id]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await api.delete(`/products/${id}/`);
      if (res.success) {
        toast.success('Deleted');
        fetchVendorProducts();
      } else {
        toast.error(res.error || 'Delete failed');
      }
    } catch (e) { console.error(e); toast.error('Delete failed'); }
  };

  const handleStartEditStock = (productId: number, currentStock: number) => {
    setEditingStockId(productId);
    setEditingStockValue(String(currentStock));
  };

  const handleSaveStock = async (productId: number) => {
    const newStock = parseInt(editingStockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Stock must be a valid number");
      return;
    }

    try {
      const res = await api.patch(`/products/${productId}/`, {
        stock_quantity: newStock,
      });
      if (res.success) {
        toast.success("Stock updated successfully");
        fetchVendorProducts();
        setEditingStockId(null);
      } else {
        toast.error(res.error || "Failed to update stock");
      }
    } catch (e) {
      console.error("Failed to update stock:", e);
      toast.error("Failed to update stock");
    }
  };

  const handleCancelEditStock = () => {
    setEditingStockId(null);
    setEditingStockValue("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your store, products, and orders</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/vendor/product/new')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg px-6 py-2.5 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        {vendorStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Products Card */}
            <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{vendorStats.product_count ?? vendorProducts.length}</p>
            </Card>

            {/* Orders Card */}
            <Card 
              className="p-6 shadow-sm border-0 hover:shadow-md transition cursor-pointer group" 
              onClick={() => navigate('/vendor/orders')}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{vendorStats.total_orders ?? '—'}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">View Details <span>→</span></p>
            </Card>

            {/* Store Card */}
            <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Store className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Store Name</p>
              <p className="text-2xl font-bold text-gray-900 truncate">{vendorStats.store_name || 'Not Set'}</p>
            </Card>

            {/* Profile Card */}
            <Card className="p-6 shadow-sm border-0 hover:shadow-md transition flex flex-col justify-between">
              <div className="flex items-start mb-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <Button 
                onClick={() => navigate('/vendor/profile')}
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Edit Profile
              </Button>
            </Card>
          </div>
        )}

        {/* Products Section */}
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  {activeTab === "products" ? "Your Products" : "Customer Reviews"}
                </h2>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("products")}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === "products"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Products ({vendorProducts.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("stock")}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === "stock"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Stock Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 px-4 font-medium transition-colors ${
                  activeTab === "reviews"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Reviews
                </div>
              </button>
            </div>
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <>
              {vendorProducts.length === 0 ? (
                <Card className="p-12 text-center shadow-sm border-0">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600 mb-4">Get started by adding your first product to your catalog</p>
                  <Button 
                    onClick={() => navigate('/vendor/product/new')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create First Product
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorProducts.map((p) => (
                    <Card key={p.id} className="p-0 shadow-sm border-0 hover:shadow-md transition flex flex-col justify-between overflow-hidden">
                      {/* Product Image */}
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-3 gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <img 
                                src={p.image} 
                                alt={p.name}
                                className="h-16 w-16 object-cover rounded flex-shrink-0"
                              />
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{p.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{p.description?.substring(0, 60)}...</p>
                              </div>
                            </div>
                            {p.is_featured && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex-shrink-0">Featured</span>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-700">
                            <span className="font-semibold">{formatPrice(Number(p.price))}</span>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" /> 
                              <span>{p.stock_quantity} in stock</span>
                            </div>
                            {p.stock_quantity === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                <AlertCircle className="h-3 w-3" />
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 border-t pt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/vendor/product/${p.id}/edit`)}
                            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(p.id)}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Stock Management Tab */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              {vendorProducts.length === 0 ? (
                <Card className="p-12 text-center shadow-sm border-0">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products To Manage</h3>
                  <p className="text-gray-600 mb-4">Create products first to manage their stock</p>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Current Stock</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(Number(product.price))}</td>
                          <td className="px-6 py-4">
                            {editingStockId === product.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingStockValue}
                                  onChange={(e) => setEditingStockValue(e.target.value)}
                                  className="w-20 h-9 border-gray-300"
                                />
                              </div>
                            ) : (
                              <span className="font-semibold text-gray-900">{product.stock_quantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {product.stock_quantity === 0 ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                <AlertCircle className="h-3 w-3" />
                                Out of Stock
                              </span>
                            ) : product.stock_quantity < product.low_stock_threshold ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <CheckCircle className="h-3 w-3" />
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {editingStockId === product.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveStock(product.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEditStock}
                                    className="border-gray-300 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartEditStock(product.id, product.stock_quantity)}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" /> Edit Stock
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="bg-white rounded-lg p-6">
              <VendorReviewsDashboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
