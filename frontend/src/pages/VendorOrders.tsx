import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const VendorOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await api.get<any>("/orders/my_orders/");
      if (res.success && res.data) {
        const payload: any = res.data;
        const items = Array.isArray(payload) ? payload : payload.results || [];
        setOrders(items);
      } else {
        toast.error("Failed to load orders");
      }
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number) => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }
    setIsUpdating(true);
    try {
      const payload: any = { status: newStatus };
      // When delivered, mark payment as completed
      if (newStatus === "DELIVERED") {
        payload.payment_status = "COMPLETED";
      }
      const res = await api.put(`/orders/${orderId}/update_status/`, payload);
      if (res.success) {
        setOrders(orders.map(o => o.id === orderId ? res.data : o));
        setEditingOrderId(null);
        setNewStatus("");
        toast.success("Order status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Sales & Orders</h1>
        <Button variant="outline" onClick={() => navigate("/vendor")}>Back to Dashboard</Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">Order #{order.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <p>Customer: {order.customer_email}</p>
                    <p>Total: ${Number(order.total_amount).toFixed(2)}</p>
                    <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  {expandedOrder === order.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items && order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.product_name} x {item.quantity}
                          </span>
                          <span>${Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1">Shipping Address</h3>
                    <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1">Payment Method</h3>
                    <p className="text-sm text-muted-foreground">{order.payment_method}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1">Order Details</h3>
                    <div className="text-sm space-y-1">
                      <p>Created: {new Date(order.created_at).toLocaleString()}</p>
                      <p>Updated: {new Date(order.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.payment_status !== "COMPLETED" && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-sm mb-3">Update Order Status</h3>
                      {editingOrderId === order.id ? (
                        <div className="space-y-3">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                          >
                            <option value="">Select new status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(order.id)}
                              disabled={isUpdating}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingOrderId(null);
                                setNewStatus("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingOrderId(order.id);
                            setNewStatus(order.status);
                          }}
                        >
                          Change Status
                        </Button>
                      )}
                    </div>
                  )}
                  {order.payment_status === "COMPLETED" && (
                    <div className="border-t pt-4 text-sm text-muted-foreground italic">
                      This order is complete and cannot be modified.
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
