import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/services/api";

export type UserRole = "ADMIN" | "VENDOR" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    vendorProfile?: { store_name: string; phone: string; address: string; description: string; selling_category_id: string }
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loginError?: string;
  updateUser?: (next: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
      const response = await api.post("/auth/login/", { email, password });
      
      if (!response.success) {
        // Backend returned an error (e.g., vendor not approved)
        console.error("Login error from backend:", response.error);
        return {
          success: false,
          error: response.error || "Login failed"
        };
      }

      if (response.data) {
        const { access, refresh, user: userData } = response.data as any;
        
        // Store tokens
        localStorage.setItem("authToken", access);
        localStorage.setItem("refreshToken", refresh);
        
        // Store user info
        const userObj = {
          id: userData.id || String(userData.user_id),
          email: userData.email,
          name: userData.first_name || userData.name || userData.email,
          first_name: userData.first_name,
          role: userData.role || "CUSTOMER"
        };
        
        setUser(userObj);
        localStorage.setItem("user", JSON.stringify(userObj));
        return {
          success: true,
          role: userData.role || "CUSTOMER"
        };
      }
      return {
        success: false,
        error: "No user data returned"
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    vendorProfile?: { store_name: string; phone: string; address: string; description: string; selling_category_id: string }
  ): Promise<boolean> => {
    try {
      const payload: any = {
        first_name: name,
        email,
        password,
        password2: password,
        role
      };

      // Add vendor fields if provided
      if (vendorProfile && role === "VENDOR") {
        payload.store_name = vendorProfile.store_name;
        payload.phone = vendorProfile.phone;
        payload.address = vendorProfile.address;
        payload.description = vendorProfile.description;
        payload.selling_category_id = vendorProfile.selling_category_id ? Number(vendorProfile.selling_category_id) : null;
      }

      const response = await api.post("/auth/register/", payload);
      
      if (response.success && response.data) {
        // Registration successful - user needs to manually login
        return true;
      }
      return false;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
  };

  const updateUser = (next: Partial<User>) => {
    const updated = { ...(user || {}), ...next } as User;
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
