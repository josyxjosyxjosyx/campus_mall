// API service layer for backend integration
// This will be used throughout the application

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private getHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithoutAuth = false
  ): Promise<ApiResponse<T>> {
    try {
      const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const url = `${API_BASE_URL}${normalizedEndpoint}`;
      const fetchOptions = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      // Log request details
      console.log(`[API] ${options.method || 'GET'} ${url}`, fetchOptions.body ? JSON.parse(fetchOptions.body as string) : '');

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorData: any = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData.error || errorData.detail || JSON.stringify(errorData) || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        console.error(`[API] Error (${response.status}):`, errorMessage);
        console.error(`[API] Full error response:`, errorData);

        // If 401 with invalid token, clear it and retry without auth
        if (response.status === 401 && errorData?.code === 'token_not_valid' && !retryWithoutAuth) {
          console.log('[API] Invalid token detected, clearing and retrying...');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // Retry request without the invalid token
          const retryOptions = { ...options };
          const retryHeaders = { ...retryOptions.headers };
          delete retryHeaders['Authorization'];
          retryOptions.headers = retryHeaders;
          return this.request<T>(endpoint, retryOptions, true);
        }
        
        return {
          success: false,
          error: errorMessage,
          data: errorData,
        };
      }

      // Handle 204 No Content (e.g., from DELETE requests)
      if (response.status === 204) {
        console.log(`[API] Success (204 No Content)`);
        return { success: true, data: null as T };
      }

      const data = await response.json().catch(() => ({}));
      console.log(`[API] Success`, data);
      return { success: true, data };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[API] Exception:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // AUTH ENDPOINTS
  async login(email: string, password: string) {
    return this.post("/auth/login/", { email, password });
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: "CUSTOMER" | "VENDOR" | "ADMIN"
  ) {
    return this.post("/auth/register/", { name, email, password, role });
  }

  async logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    return { success: true };
  }

  // PRODUCTS ENDPOINTS
  async getProducts(filters?: { category?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);
    const query = params.toString();
    return this.request(`/products/${query ? `?${query}` : ""}`);
  }

  async getFeaturedProducts() {
    return this.request(`/products/featured/`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}/`);
  }

  async createProduct(productData: FormData) {
    // Use direct fetch for FormData to avoid forcing JSON Content-Type
    const url = `${API_BASE_URL}/products/`;
    const token = localStorage.getItem("authToken");
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: productData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.error || errorData.detail || `HTTP ${res.status}`, data: errorData };
    }
    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  }

  async updateProductFormData(id: string, formData: FormData) {
    const url = `${API_BASE_URL}/products/${id}/`;
    const token = localStorage.getItem("authToken");
    const res = await fetch(url, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.error || errorData.detail || `HTTP ${res.status}`, data: errorData };
    }
    const data = await res.json().catch(() => ({}));
    return { success: true, data };
  }

  async updateProduct(id: string, productData: Partial<any>) {
    return this.request(`/products/${id}/`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}/`, { method: "DELETE" });
  }

  // ORDERS ENDPOINTS
  async createOrder(orderData: any) {
    return this.request("/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(filters?: { status?: string; vendorId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.vendorId) params.append("vendorId", filters.vendorId);
    const query = params.toString();
    return this.request(`/orders/${query ? `?${query}` : ""}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}/`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/update_status/`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // VENDORS ENDPOINTS
  async getVendors() {
    return this.request("/vendors/");
  }

  async getTestimonials() {
    const res = await this.request(`/testimonials/?is_active=true`);
    if (!res.success || !res.data) return res;
    // backend uses paginated response { count, next, previous, results }
    const payload: any = res.data as any;
    const items = Array.isArray(payload) ? payload : payload.results || [];
    return { ...res, data: items };
  }

  async getVendor(id: string) {
    return this.request(`/vendors/${id}/`);
  }

  async getMyStore() {
    return this.request(`/vendors/my_store/`);
  }

  async updateMyStore(payload: any) {
    return this.request(`/vendors/my_store/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // ADMIN ENDPOINTS
  async getAllUsers(role?: string) {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    const query = params.toString();
    return this.request(`/admin/users/${query ? `?${query}` : ""}`);
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request(`/admin/users/${userId}/status/`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async getCategories() {
    return this.request("/categories/");
  }

  async createCategory(categoryData: any) {
    return this.request("/admin/categories/create/", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async getAdminStats() {
    return this.request("/admin/stats/");
  }

  async generateReport(type: string, filters?: any) {
    const params = new URLSearchParams();
    params.append("type", type);
    if (filters) Object.entries(filters).forEach(([k, v]) => params.append(k, String(v)));
    return this.request(`/admin/reports/?${params.toString()}`);
  }

  // PAYMENTS – Stripe
  async createStripeIntent(body: {
    customer_email: string;
    orders: Array<{
      vendor_id: number;
      total_amount: number;
      shipping_address: string;
      items: Array<{ productId: number; quantity: number; price: number }>;
    }>;
  }) {
    return this.request<{
      client_secret: string;
      order_ids: string[];
      stripe_publishable_key: string;
    }>("/payments/stripe/create-intent/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // PAYMENTS – Paystack
  async createPaystackInitialize(body: {
    customer_email: string;
    callback_url: string;
    orders: Array<{
      vendor_id: number;
      total_amount: number;
      shipping_address: string;
      items: Array<{ productId: number; quantity: number; price: number }>;
    }>;
  }) {
    return this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
      order_ids: string[];
    }>("/payments/paystack/initialize/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async verifyPaystack(reference: string) {
    return this.request<{ verified: boolean; order_ids: string[] }>(
      "/payments/paystack/verify/",
      {
        method: "POST",
        body: JSON.stringify({ reference }),
      }
    );
  }

  // COUPONS ENDPOINTS
  async getCoupons() {
    return this.request("/coupons/");
  }

  async getCoupon(id: string) {
    return this.request(`/coupons/${id}/`);
  }

  async createCoupon(couponData: any) {
    return this.request("/coupons/", {
      method: "POST",
      body: JSON.stringify(couponData),
    });
  }

  async updateCoupon(id: string, couponData: any) {
    return this.request(`/coupons/${id}/`, {
      method: "PUT",
      body: JSON.stringify(couponData),
    });
  }

  async deleteCoupon(id: string) {
    return this.request(`/coupons/${id}/`, { method: "DELETE" });
  }

  async validateCoupon(code: string, productId?: number) {
    return this.request("/coupons/validate_code/", {
      method: "POST",
      body: JSON.stringify({ code, product_id: productId }),
    });
  }

  async getActiveCoupons() {
    return this.request("/coupons/active/");
  }

  // ADDRESSES ENDPOINTS
  async getAddresses() {
    return this.request("/addresses/");
  }

  async getAddress(id: string) {
    return this.request(`/addresses/${id}/`);
  }

  async createAddress(addressData: any) {
    return this.request("/addresses/", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(id: string, addressData: any) {
    return this.request(`/addresses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(id: string) {
    return this.request(`/addresses/${id}/`, { method: "DELETE" });
  }
}

export const api = new ApiService();
export default api;
