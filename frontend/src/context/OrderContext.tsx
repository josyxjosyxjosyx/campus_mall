import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem } from "./CartContext";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => void;
  getOrder: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getUserOrders: (userId: string) => Order[];
  getVendorOrders: (vendorId: string) => Order[];
  cancelOrder: (id: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ord1",
      userId: "u3",
      vendorId: "v1",
      items: [],
      totalAmount: 89.99,
      status: "DELIVERED",
      shippingAddress: "123 Main St, City, Country",
      paymentMethod: "CREDIT_CARD",
      paymentStatus: "COMPLETED",
      createdAt: "2025-02-01",
      updatedAt: "2025-02-05",
      estimatedDelivery: "2025-02-05",
    },
  ]);

  const createOrder = (
    order: Omit<Order, "id" | "createdAt" | "updatedAt">
  ) => {
    const newOrder: Order = {
      ...order,
      id: `ord${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
  };

  const getOrder = (id: string) => {
    return orders.find((o) => o.id === id);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
      )
    );
  };

  const getUserOrders = (userId: string) => {
    return orders.filter((o) => o.userId === userId);
  };

  const getVendorOrders = (vendorId: string) => {
    return orders.filter((o) => o.vendorId === vendorId);
  };

  const cancelOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: "CANCELLED", updatedAt: new Date().toISOString() }
          : o
      )
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        getOrder,
        updateOrderStatus,
        getUserOrders,
        getVendorOrders,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context;
};
