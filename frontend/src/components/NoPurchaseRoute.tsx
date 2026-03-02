import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
}

// Prevent ADMIN and VENDOR users from accessing purchase pages (homepage/products).
// Guests and CUSTOMERS are allowed.
const NoPurchaseRoute = ({ children }: Props) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{children}</>;
  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user?.role === "VENDOR") return <Navigate to="/vendor" replace />;

  return <>{children}</>;
};

export default NoPurchaseRoute;
