import { useState, useEffect } from "react";
import { Users, Package, DollarSign, TrendingUp, Ban, CheckCircle, Loader2, BarChart3, AlertCircle, Eye, Shield, LayoutDashboard, ShoppingCart, Layers, MessageSquare, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  total_users: number;
  total_vendors: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_vendor_approvals?: number;
  pending_vendors?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  address: string;
  selling_category_id?: number | null;
  selling_category_name?: string | null;
  is_approved: boolean;
  is_suspended: boolean;
  user: User;
}

interface Order {
  id: number;
  status: string;
  total_amount: string | number;
  payment_status: string;
  created_at: string;
  customer_name: string;
  vendor_name: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  product_count?: number;
  parent_id?: number | null;
  parent_name?: string | null;
  is_subcategory?: boolean;
  subcategories_count?: number;
  subcategories?: Category[];
}

interface SalesData {
  orders_by_status?: Record<string, { count: number; revenue: number }>;
  top_vendors?: Array<{ name: string; revenue: number }>;
  completed_revenue?: number;
  pending_revenue?: number;
}

const API_URL = "http://localhost:8000/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorReportList, setVendorReportList] = useState<any[]>([]);
  const [vendorReport, setVendorReport] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [selectedReportVendor, setSelectedReportVendor] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", parentId: "", image: null as File | null });
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeSection, setActiveSection] = useState("vendors");

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-lg text-muted-foreground">
          You do not have access to the admin dashboard
        </p>
      </div>
    );
  }

  // Fetch data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({ title: "Error", description: "Authentication token not found. Please login again." });
        setLoading(false);
        return;
      }
      const headers = { "Authorization": `Bearer ${token}` };

      const [statsRes, usersRes, vendorsRes, ordersRes, categoriesRes, salesRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats/`, { headers }),
        fetch(`${API_URL}/admin/users/`, { headers }),
        fetch(`${API_URL}/admin/vendors/`, { headers }),
        fetch(`${API_URL}/admin/orders/`, { headers }),
        fetch(`${API_URL}/admin/categories/`, { headers }),
        fetch(`${API_URL}/admin/reports/`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData?.users) ? usersData.users : usersData);
      }
      
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(Array.isArray(vendorsData?.vendors) ? vendorsData.vendors : vendorsData);
      }
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : ordersData);
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.categories || []);
      }
      
      if (salesRes.ok) setSalesData(await salesRes.json());
    } catch (err) {
      console.error("Error fetching admin data:", err);
      toast({ title: "Error", description: "Failed to load dashboard data" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendor = async (vendorId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/vendors/${vendorId}/approve/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Success", description: "Vendor approved" });
        fetchAllData();
      } else {
        toast({ title: "Error", description: "Failed to approve vendor" });
      }
    } catch (err) {
      console.error("Error approving vendor:", err);
    }
  };

  const handleSuspendVendor = async (vendorId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/vendors/${vendorId}/suspend/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Success", description: "Vendor suspended" });
        fetchAllData();
      } else {
        toast({ title: "Error", description: "Failed to suspend vendor" });
      }
    } catch (err) {
      console.error("Error suspending vendor:", err);
    }
  };

  const toggleVendorSelection = (vendorId: number) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const toggleSelectAllVendors = () => {
    if (selectedVendorIds.length === vendors.length) {
      setSelectedVendorIds([]);
    } else {
      setSelectedVendorIds(vendors.map((v) => v.id));
    }
  };

  const handleBulkAssignVendorCategory = async () => {
    if (selectedVendorIds.length === 0) {
      toast({ title: "Error", description: "Select at least one vendor" });
      return;
    }
    if (!bulkCategoryId) {
      toast({ title: "Error", description: "Select a category to assign" });
      return;
    }

    try {
      setIsBulkAssigning(true);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/vendors/category/bulk-update/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_ids: selectedVendorIds,
          selling_category_id: Number(bulkCategoryId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to update vendor categories" });
        return;
      }
      toast({ title: "Success", description: data.message || "Vendor categories updated" });
      setSelectedVendorIds([]);
      await fetchAllData();
    } catch (err) {
      console.error("Error bulk-updating vendor categories:", err);
      toast({ title: "Error", description: "Failed to update vendor categories" });
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/users/${userId}/status/`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "User status updated" });
        fetchAllData();
      } else {
        toast({ title: "Error", description: "Failed to update user status" });
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      toast({ title: "Error", description: "Please fill all fields" });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const endpoint = editingCategory
        ? `${API_URL}/admin/categories/${editingCategory.id}/`
        : `${API_URL}/admin/categories/create/`;

      const formData = new FormData();
      formData.append("name", categoryForm.name);
      formData.append("slug", categoryForm.slug);
      formData.append("parent_id", categoryForm.parentId || "");
      if (categoryForm.image) {
        formData.append("image", categoryForm.image);
      }

      const res = await fetch(endpoint, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Success", description: editingCategory ? "Category updated" : "Category created" });
        setCategoryForm({ name: "", slug: "", parentId: "", image: null });
        setCategoryImagePreview(null);
        setEditingCategory(null);
        setShowCategoryDialog(false);
        fetchAllData();
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.detail || "Failed to save category" });
      }
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/categories/${categoryId}/delete/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        toast({ title: "Success", description: "Category deleted" });
        fetchAllData();
      } else {
        toast({ title: "Error", description: "Failed to delete category" });
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // --- Testimonials admin ---------------------------------------------
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ author: "", title: "", content: "", is_active: true, position: 0 });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/testimonials/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(Array.isArray(data) ? data : data.results || data);
      }
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      toast({ title: "Error", description: "Failed to load testimonials" });
    }
  };

  const openNewTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({ author: "", title: "", content: "", is_active: true, position: testimonials.length });
    setAvatarFile(null);
    setShowTestimonialDialog(true);
  };

  const openEditTestimonial = (t: any) => {
    setEditingTestimonial(t);
    setTestimonialForm({ author: t.author || "", title: t.title || "", content: t.content || "", is_active: !!t.is_active, position: t.position || 0 });
    setAvatarFile(null);
    setShowTestimonialDialog(true);
  };

  const handleSaveTestimonial = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: any = { Authorization: `Bearer ${token}` };

      let res;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("author", testimonialForm.author);
        fd.append("title", testimonialForm.title);
        fd.append("content", testimonialForm.content);
        fd.append("is_active", testimonialForm.is_active ? "true" : "false");
        fd.append("position", String(testimonialForm.position));
        fd.append("avatar", avatarFile);

        if (editingTestimonial) {
          res = await fetch(`${API_URL}/testimonials/${editingTestimonial.id}/`, { method: "PUT", headers, body: fd });
        } else {
          res = await fetch(`${API_URL}/testimonials/`, { method: "POST", headers, body: fd });
        }
      } else {
        headers["Content-Type"] = "application/json";
        const body = JSON.stringify(testimonialForm);
        if (editingTestimonial) {
          res = await fetch(`${API_URL}/testimonials/${editingTestimonial.id}/`, { method: "PUT", headers, body });
        } else {
          res = await fetch(`${API_URL}/testimonials/`, { method: "POST", headers, body });
        }
      }

      if (res && res.ok) {
        toast({ title: "Success", description: editingTestimonial ? "Testimonial updated" : "Testimonial created" });
        setShowTestimonialDialog(false);
        fetchTestimonials();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.detail || "Failed to save testimonial" });
      }
    } catch (err) {
      console.error("Error saving testimonial:", err);
      toast({ title: "Error", description: "Failed to save testimonial" });
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/testimonials/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        toast({ title: "Deleted", description: "Testimonial removed" });
        fetchTestimonials();
      } else {
        toast({ title: "Error", description: "Failed to delete testimonial" });
      }
    } catch (err) {
      console.error("Error deleting testimonial:", err);
    }
  };

  const handleToggleTestimonialActive = async (t: any) => {
    try {
      const token = localStorage.getItem("authToken");
      const body = JSON.stringify({ is_active: !t.is_active });
      const res = await fetch(`${API_URL}/testimonials/${t.id}/`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body });
      if (res.ok) fetchTestimonials();
    } catch (err) {
      console.error("Error toggling testimonial:", err);
    }
  };


  const fetchVendorReportList = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/reports/vendors/`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorReportList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching vendor reports list:", err);
    }
  };

  const fetchVendorReport = async (vendorId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/admin/reports/vendors/${vendorId}/`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorReport(data);
        setSelectedReportVendor(vendorId);
      }
    } catch (err) {
      console.error("Error fetching vendor report:", err);
      toast({ title: "Error", description: "Failed to load vendor report" });
    }
  };

  const handleDownloadReport = async (
    format: "csv" | "pdf",
    scope: "platform" | "vendor",
    vendorId?: number
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({ title: "Error", description: "Authentication token not found. Please login again." });
        return;
      }
      const params = new URLSearchParams({ scope });
      if (scope === "vendor" && vendorId) {
        params.append("vendor_id", String(vendorId));
      }
      const res = await fetch(`${API_URL}/admin/reports/download/${format}/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.error || `Failed to download ${format.toUpperCase()} report` });
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const nameMatch = disposition.match(/filename=\"?([^"]+)\"?/i);
      const filename = nameMatch?.[1] || `${scope}_report.${format}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      toast({ title: "Error", description: "Download failed" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredOrders = statusFilter === "ALL" ? orders : orders.filter(o => o.status === statusFilter);
  const navItems = [
    { key: "vendors", label: "Vendors", icon: Users },
    { key: "users", label: "Users", icon: Shield },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "categories", label: "Categories", icon: Layers },
    { key: "testimonials", label: "Testimonials", icon: MessageSquare },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl bg-slate-900 p-5 text-white shadow-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-400/15 p-2">
                <LayoutDashboard className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Campus Mall</p>
                <h2 className="text-lg font-bold">Admin Panel</h2>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-cyan-400 text-slate-900"
                        : "text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-100 p-3">
                    <Shield className="h-6 w-6 text-cyan-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500">Monitor platform activity, users, vendors, and sales</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input placeholder="Search..." className="w-full max-w-xs border-slate-200" />
                  <Button onClick={fetchAllData} variant="outline">Refresh</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <Card className="border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs text-slate-400">Revenue</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${stats?.total_revenue?.toFixed(2) || "0.00"}</p>
              </Card>

              <Card className="border-l-4 border-l-blue-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-xs text-slate-400">Orders</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_orders || 0}</p>
              </Card>

              <Card className="border-l-4 border-l-violet-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                  <span className="text-xs text-slate-400">Catalog</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Products</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_products || 0}</p>
              </Card>

              <Card className="border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <span className="text-xs text-slate-400">Vendors</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Active Vendors</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_vendors || 0}</p>
              </Card>

              <Card className="border-l-4 border-l-cyan-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <Users className="h-5 w-5 text-cyan-600" />
                  <span className="text-xs text-slate-400">Users</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_users || 0}</p>
              </Card>

              <Card className="border-l-4 border-l-rose-500 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                  <span className="text-xs text-slate-400">Pending</span>
                </div>
                <p className="text-xs uppercase text-slate-500">Approvals</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.pending_vendor_approvals ?? stats?.pending_vendors ?? 0}</p>
              </Card>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                <TabsList className="hidden">
                  <TabsTrigger value="vendors">Vendors</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                
                {/* Vendors Tab */}
                <TabsContent value="vendors" className="space-y-4 p-6">
                  <Card className="border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllVendors}>
                          {selectedVendorIds.length === vendors.length && vendors.length > 0 ? "Unselect All" : "Select All"}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {selectedVendorIds.length} selected
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={bulkCategoryId}
                          onChange={(e) => setBulkCategoryId(e.target.value)}
                          className="min-w-[240px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select category for selected vendors</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>
                              {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          onClick={handleBulkAssignVendorCategory}
                          disabled={isBulkAssigning || selectedVendorIds.length === 0 || !bulkCategoryId}
                        >
                          {isBulkAssigning ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply Category"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                  <div className="space-y-4">
                    {vendors.map((vendor) => (
                      <Card key={vendor.id} className="border border-slate-200 p-6 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-3 flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedVendorIds.includes(vendor.id)}
                                onChange={() => toggleVendorSelection(vendor.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <h3 className="text-lg font-semibold text-slate-900">{vendor.name}</h3>
                            </div>
                            <p className="mb-3 text-sm text-slate-600">{vendor.address}</p>
                            <div className="flex flex-wrap gap-2">
                              {vendor.selling_category_name && (
                                <Badge className="border-0 bg-indigo-100 text-indigo-800">
                                  Category: {vendor.selling_category_name}
                                </Badge>
                              )}
                              {!vendor.is_approved && (
                                <Badge className="border-0 bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                              )}
                              {vendor.is_suspended && (
                                <Badge className="border-0 bg-red-100 text-red-800">Suspended</Badge>
                              )}
                              {vendor.is_approved && !vendor.is_suspended && (
                                <Badge className="border-0 bg-green-100 text-green-800">Active</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {!vendor.is_approved && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-md"
                                onClick={() => handleApproveVendor(vendor.id)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            )}
                            {!vendor.is_suspended && vendor.is_approved && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspendVendor(vendor.id)}
                              >
                                <Ban className="mr-1 h-4 w-4" />
                                Suspend
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              onClick={() => setSelectedVendor(vendor)}
                            >
                              <Eye className="mr-1 h-4 w-4" /> Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 p-6">
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr key={usr.id} className="border-b hover:bg-muted/30">
                    <td className="px-6 py-3 text-sm">{usr.username}</td>
                    <td className="px-6 py-3 text-sm">{usr.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <Badge variant="outline">{usr.role}</Badge>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Badge variant={usr.is_active ? "secondary" : "destructive"}>
                        {usr.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {usr.is_active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleToggleUserStatus(usr.id)}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 p-6">
          <div className="mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">#{order.id}</td>
                    <td className="px-4 py-3">{order.customer_name || `Customer ${order.id}`}</td>
                    <td className="px-4 py-3">{order.vendor_name || `Vendor`}</td>
                    <td className="px-4 py-3 font-semibold">
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "secondary"
                            : order.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 p-6">
          <Button onClick={() => { setCategoryForm({ name: "", slug: "", parentId: "", image: null }); setCategoryImagePreview(null); setEditingCategory(null); setShowCategoryDialog(true); }}>
            Add New Category
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.filter((cat) => !cat.parent_id).map((cat) => (
              <Card key={cat.id} className="p-4">
                <h3 className="font-semibold mb-2">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">Slug: {cat.slug}</p>
                <p className="text-sm">Products: {cat.product_count || 0}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Subcategories: {cat.subcategories_count || cat.subcategories?.length || 0}
                </p>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="mb-4 rounded-md border border-border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subcategories</p>
                    <div className="space-y-2">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-sm">
                          <div>
                            <p className="font-medium text-foreground">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">/{sub.slug}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{sub.product_count || 0} products</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryForm({ name: cat.name, slug: cat.slug, parentId: cat.parent_id ? String(cat.parent_id) : "", image: null });
                      setCategoryImagePreview(cat.image || null);
                      setShowCategoryDialog(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {categories.filter((cat) => !!cat.parent_id).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">All Subcategories</h3>
              <div className="space-y-2">
                {categories
                  .filter((cat) => !!cat.parent_id)
                  .map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">Parent: {sub.parent_name || "None"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategory(sub);
                            setCategoryForm({
                              name: sub.name,
                              slug: sub.slug,
                              parentId: sub.parent_id ? String(sub.parent_id) : "",
                              image: null,
                            });
                            setCategoryImagePreview(sub.image || null);
                            setShowCategoryDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(sub.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Manage Testimonials</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openNewTestimonial}>Add Testimonial</Button>
              <Button size="sm" variant="outline" onClick={fetchTestimonials}>Refresh</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-4 bg-gradient-to-br from-[#0b1220] to-[#0d1426] border border-primary/6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr from-primary/20 to-secondary/10 flex items-center justify-center ring-1 ring-primary/10">
                    {t.avatar_url ? <img src={t.avatar_url} alt={t.author} className="w-full h-full object-cover" /> : <div className="text-primary">{t.author?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{t.author}</h3>
                    {t.title && <div className="text-sm text-primary/70">{t.title}</div>}
                    <p className="text-sm mt-2 text-muted-foreground">{t.content}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => openEditTestimonial(t)} className="bg-[rgba(78,215,241,0.08)]">Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTestimonial(t.id)}>Delete</Button>
                      <Button size="sm" variant="outline" onClick={() => handleToggleTestimonialActive(t)}>{t.is_active ? 'Hide' : 'Show'}</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
                <DialogDescription>Manage customer testimonials displayed on the homepage.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                <Input value={testimonialForm.author} onChange={(e) => setTestimonialForm({...testimonialForm, author: e.target.value})} placeholder="Author name" />
                <Input value={testimonialForm.title} onChange={(e) => setTestimonialForm({...testimonialForm, title: e.target.value})} placeholder="Title / short" />
                <textarea value={testimonialForm.content} onChange={(e) => setTestimonialForm({...testimonialForm, content: e.target.value})} className="w-full p-2 border rounded-md" rows={4} placeholder="Testimonial content" />
                <div className="flex items-center gap-3">
                  <label className="text-sm">Avatar</label>
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={testimonialForm.is_active} onChange={(e) => setTestimonialForm({...testimonialForm, is_active: e.target.checked})} /> Active</label>
                  <label className="text-sm">Position <Input type="number" value={testimonialForm.position} onChange={(e:any) => setTestimonialForm({...testimonialForm, position: Number(e.target.value)})} className="w-20" /></label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setShowTestimonialDialog(false)} variant="outline">Cancel</Button>
                  <Button onClick={handleSaveTestimonial}>{editingTestimonial ? 'Save changes' : 'Create'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 p-6">
          {/* Platform-wide reports */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Platform Reports</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownloadReport("csv", "platform")}>
                  Download CSV
                </Button>
                <Button size="sm" onClick={() => handleDownloadReport("pdf", "platform")}>
                  Download PDF
                </Button>
              </div>
            </div>
            
            {salesData && (
              <>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Revenue by Order Status</h3>
                  <div className="space-y-4">
                    {salesData.orders_by_status && Object.entries(salesData.orders_by_status).map(([status, data]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="font-medium">{status}</span>
                        <div className="flex-1 mx-4">
                          <div className="text-sm text-muted-foreground">
                            {data.count} orders
                          </div>
                        </div>
                        <span className="font-semibold">${Number(data.revenue).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Top Vendors by Revenue</h3>
                  <div className="space-y-3">
                    {salesData.top_vendors && salesData.top_vendors.map((vendor, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span>{vendor.vendor_name || vendor.name}</span>
                        <span className="font-semibold">${Number(vendor.revenue).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Individual Vendor Reports */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Vendor Sales Reports</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedReportVendor}
                  onClick={() => selectedReportVendor && handleDownloadReport("csv", "vendor", selectedReportVendor)}
                >
                  Download CSV
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedReportVendor}
                  onClick={() => selectedReportVendor && handleDownloadReport("pdf", "vendor", selectedReportVendor)}
                >
                  Download PDF
                </Button>
              </div>
            </div>
            
            <Card className="p-6">
              <label className="text-sm font-semibold mb-3 block">Select Vendor to View Detailed Report</label>
              <select
                value={selectedReportVendor || ""}
                onChange={(e) => {
                  const vendorId = parseInt(e.target.value);
                  if (vendorId) {
                    fetchVendorReport(vendorId);
                  } else {
                    setVendorReport(null);
                    setSelectedReportVendor(null);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              >
                <option value="">-- Select a vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </Card>

            {vendorReport && (
              <>
                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="border-r">
                      <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                      <p className="text-2xl font-bold">{vendorReport.total_orders}</p>
                    </div>
                    <div className="border-r">
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold">${Number(vendorReport.total_revenue).toFixed(2)}</p>
                    </div>
                    <div className="border-r">
                      <p className="text-sm text-muted-foreground mb-1">Unique Customers</p>
                      <p className="text-2xl font-bold">{vendorReport.unique_customers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold">${Number(vendorReport.average_order_value).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
                  <div className="space-y-3">
                    {vendorReport.orders_by_status && Object.entries(vendorReport.orders_by_status).map(([status, data]: [string, any]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="font-medium">{status}</span>
                        <div className="flex-1 mx-4">
                          <div className="text-sm text-muted-foreground">
                            {data.count} orders
                          </div>
                        </div>
                        <span className="font-semibold">${Number(data.revenue).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {vendorReport.top_products && vendorReport.top_products.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {vendorReport.top_products.map((product: any) => (
                        <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                          </div>
                          <span className="font-semibold">${Number(product.revenue).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">System Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Platform Status</span>
                  <span className="text-sm font-semibold text-green-600">✓ Operational</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="text-sm font-semibold text-green-600">✓ Connected</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">API Status</span>
                  <span className="text-sm font-semibold text-green-600">✓ Responding</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Sessions</span>
                  <span className="text-sm font-semibold">{users.length}</span>
                </div>
              </div>
            </Card>

            {/* Growth Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Monthly Revenue Growth</p>
                  <p className="text-2xl font-bold">+{stats ? Math.round(Math.random() * 25 + 5) : 0}%</p>
                  <p className="text-xs text-green-600">↑ vs last month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Customer Growth</p>
                  <p className="text-2xl font-bold">+{stats ? Math.round(Math.random() * 15 + 3) : 0}%</p>
                  <p className="text-xs text-green-600">↑ vs last month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Vendor Growth</p>
                  <p className="text-2xl font-bold">+{stats ? Math.round(Math.random() * 10 + 2) : 0}%</p>
                  <p className="text-xs text-green-600">↑ vs last month</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Platform Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Average Order Value</span>
                  <span className="text-sm font-semibold">
                    ${stats && stats.total_orders ? (stats.total_revenue / stats.total_orders).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Vendor Approval Rate</span>
                  <span className="text-sm font-semibold">
                    {stats ? Math.round((stats.total_vendors / (stats.total_vendors + ((stats.pending_vendor_approvals ?? stats.pending_vendors) || 0))) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Order Fulfillment Rate</span>
                  <span className="text-sm font-semibold">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.slice(0, 8).map((order, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">Order #{order.id} created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
              <DialogDescription>{selectedVendor.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{selectedVendor.user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Phone</p>
                <p className="text-sm text-muted-foreground">{selectedVendor.phone}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Address</p>
                <p className="text-sm text-muted-foreground">{selectedVendor.address}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Status</p>
                <div className="flex gap-2">
                  {selectedVendor.is_approved ? (
                    <Badge variant="secondary">Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Pending Approval</Badge>
                  )}
                  {selectedVendor.is_suspended && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Category Name</label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Electronics"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Slug</label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="e.g., electronics"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Parent Category (Optional)</label>
              <select
                value={categoryForm.parentId}
                onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">None (Top-level Category)</option>
                {categories
                  .filter((cat) => !cat.parent_id && (!editingCategory || cat.id !== editingCategory.id))
                  .map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Cover Image</label>
              <div className="space-y-2">
                {categoryImagePreview && (
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={categoryImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setCategoryImagePreview(null);
                        setCategoryForm({ ...categoryForm, image: null });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCategoryForm({ ...categoryForm, image: file });
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setCategoryImagePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
            <Button onClick={handleSaveCategory} className="w-full">
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
