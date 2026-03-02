import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOrders, OrderStatus } from "@/context/OrderContext";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, ShoppingBag, CheckCircle, TrendingUp, ArrowRight, Clock, AlertCircle, MapPin, CreditCard } from "lucide-react";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders: allOrders, getUserOrders, cancelOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [customerOrdersBackend, setCustomerOrdersBackend] = useState<any[]>([]);

  // Fetch customer orders from backend
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        const res = await api.get<any>("/orders/");
        if (res.success && res.data) {
          const orders = Array.isArray(res.data) ? res.data : res.data.results || [];
          // Normalize backend orders to camelCase
          const normalizedOrders = orders.map((order: any) => ({
            id: order.id,
            status: order.status,
            totalAmount: order.total_amount ? parseFloat(String(order.total_amount)) : 0,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            shippingAddress: order.shipping_address,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            items: order.items || [],
          }));
          setCustomerOrdersBackend(normalizedOrders);
        }
      } catch (err) {
        console.error("Failed to fetch customer orders:", err);
      }
    };

    if (user?.id) {
      fetchCustomerOrders();
    }
  }, [user?.id]);

  if (!user) return null;

  // Use backend orders if available, otherwise fallback to local context
  const orders = customerOrdersBackend.length > 0 ? customerOrdersBackend : getUserOrders(user.id);
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const deliveredOrders = orders.filter(
    (o) => o.status === "DELIVERED"
  ).length;

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  const selectedOrderData = orders.find((o) => o.id === selectedOrder);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          </div>
          <p className="text-gray-600 text-sm ml-14">Track orders, view history, and manage your account</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Orders */}
          <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          </Card>

          {/* Total Spent */}
          <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
          </Card>

          {/* Delivered */}
          <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-3xl font-bold text-gray-900">{deliveredOrders}</p>
          </Card>

          {/* Active Orders */}
          <Card className="p-6 shadow-sm border-0 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-gray-900">
              {orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length}
            </p>
          </Card>
        </div>

        {/* Orders Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Your Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} in your account</p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">All Orders</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">Active</TabsTrigger>
              <TabsTrigger value="delivered" className="data-[state=active]:bg-white">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-white">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {orders.length === 0 ? (
                <Card className="p-12 text-center shadow-sm border-0">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to place your first order</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
                    <ArrowRight className="h-4 w-4 mr-2" /> Start Shopping
                  </Button>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="p-6 shadow-sm border-0 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <p className="font-semibold text-lg text-gray-900">Order #{order.id}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span>{order.items.length} item(s)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span>${order.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedOrder(order.id)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-md flex items-center gap-1"
                      >
                        Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "SHIPPED").length === 0 ? (
                <Card className="p-8 text-center shadow-sm border-0">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No active orders right now</p>
                </Card>
              ) : (
                orders
                  .filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "SHIPPED")
                  .map((order) => (
                    <Card key={order.id} className="p-6 shadow-sm border-0 hover:shadow-md transition border-l-4 border-l-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900">Order #{order.id}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{order.items.length} item(s) • ${order.totalAmount.toFixed(2)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order.id)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Clock className="h-4 w-4 mr-1" /> Track
                        </Button>
                      </div>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4 mt-6">
              {orders.filter((o) => o.status === "DELIVERED").length === 0 ? (
                <Card className="p-8 text-center shadow-sm border-0">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No delivered orders yet</p>
                </Card>
              ) : (
                orders
                  .filter((o) => o.status === "DELIVERED")
                  .map((order) => (
                    <Card key={order.id} className="p-6 shadow-sm border-0 hover:shadow-md transition border-l-4 border-l-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            Delivered on {new Date(order.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order.id)}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4 mt-6">
              {orders.filter((o) => o.status === "CANCELLED").length === 0 ? (
                <Card className="p-8 text-center shadow-sm border-0">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No cancelled orders</p>
                </Card>
              ) : (
                orders
                  .filter((o) => o.status === "CANCELLED")
                  .map((order) => (
                    <Card key={order.id} className="p-6 shadow-sm border-0 opacity-75 border-l-4 border-l-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            Cancelled on {new Date(order.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="destructive">CANCELLED</Badge>
                      </div>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>

          {/* Manage Addresses Button */}
          <Button
            onClick={() => navigate("/addresses")}
            className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Manage Your Addresses
          </Button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderData && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Order Details
              </DialogTitle>
              <DialogDescription>Order #{selectedOrderData.id}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Order Status</p>
                <Badge className={`${getStatusColor(selectedOrderData.status)} text-sm py-1`}>
                  {selectedOrderData.status}
                </Badge>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Items ({selectedOrderData.items.length})
                </p>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  {selectedOrderData.items.map((item: any) => (
                    <div key={item.id || item.product?.id || item.product} className="flex justify-between text-sm pb-2 border-b border-gray-200 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name || item.product?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">Qty: x{item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">${(parseFloat(item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Shipping Address
                </p>
                <p className="text-sm text-gray-700">
                  {selectedOrderData.shippingAddress}
                </p>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Payment Method
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedOrderData.paymentMethod}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${selectedOrderData.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              {selectedOrderData.status !== "DELIVERED" &&
                selectedOrderData.status !== "CANCELLED" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      cancelOrder(selectedOrderData.id);
                      setSelectedOrder(null);
                    }}
                    className="w-full py-2.5"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" /> Cancel Order
                  </Button>
                )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerDashboard;
