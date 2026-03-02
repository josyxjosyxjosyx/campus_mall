import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NoPurchaseRoute from "@/components/NoPurchaseRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VendorPending from "./pages/VendorPending";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CustomerDashboard from "./pages/CustomerDashboard";
import Addresses from "./pages/Addresses";
import Profile from "./pages/Profile";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProductForm from "./pages/VendorProductForm";
import VendorProfile from "./pages/VendorProfile";
import VendorOrders from "./pages/VendorOrders";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <OrderProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<NoPurchaseRoute><Index /></NoPurchaseRoute>} />
                    <Route path="/products" element={<NoPurchaseRoute><Products /></NoPurchaseRoute>} />
                    <Route path="/products/:id" element={<NoPurchaseRoute><ProductDetail /></NoPurchaseRoute>} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/vendor-pending" element={<VendorPending />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<ProtectedRoute allowedRoles={["CUSTOMER"]}><Checkout /></ProtectedRoute>} />
                    <Route path="/checkout/success" element={<ProtectedRoute allowedRoles={["CUSTOMER"]}><CheckoutSuccess /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["CUSTOMER"]}><CustomerDashboard /></ProtectedRoute>} />
                    <Route path="/addresses" element={<ProtectedRoute allowedRoles={["CUSTOMER"]}><Addresses /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute allowedRoles={["CUSTOMER"]}><Profile /></ProtectedRoute>} />
                    <Route path="/vendor" element={<ProtectedRoute allowedRoles={["VENDOR"]}><VendorDashboard /></ProtectedRoute>} />
                    <Route path="/vendor/product/new" element={<ProtectedRoute allowedRoles={["VENDOR"]}><VendorProductForm /></ProtectedRoute>} />
                    <Route path="/vendor/product/:id/edit" element={<ProtectedRoute allowedRoles={["VENDOR"]}><VendorProductForm /></ProtectedRoute>} />
                    <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={["VENDOR"]}><VendorProfile /></ProtectedRoute>} />
                    <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={["VENDOR"]}><VendorOrders /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </OrderProvider>
          </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
