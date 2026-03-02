import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Store, Upload, ArrowLeft, Save, Mail, MapPin, Phone } from "lucide-react";

const VendorProfile = () => {
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await api.getMyStore();
      if (res.success && res.data) setStore(res.data as any);
    };
    const fetchCategories = async () => {
      const res = await api.getCategories();
      if (res.success && res.data) {
        const payload: any = res.data;
        const items = Array.isArray(payload) ? payload : payload.results || [];
        setCategories(items);
      }
    };
    fetch();
    fetchCategories();
  }, []);

  const handleSave = async () => {
    if (!store) return;
    if (!store.selling_category) {
      toast.error("Please select your selling category");
      return;
    }
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('store_name', store.store_name || '');
      form.append('description', store.description || '');
      form.append('phone', store.phone || '');
      form.append('address', store.address || '');
      form.append('selling_category', store.selling_category ? String(store.selling_category) : '');
      if (store.logoFile) form.append('logo', store.logoFile);

      // Use raw fetch to allow FormData
      const token = localStorage.getItem('authToken');
      const url = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api') + '/vendors/my_store/';
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save store');
        return;
      }

      const data = await resp.json().catch(() => ({}));
      toast.success('Store updated');
      setStore(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update store');
    } finally {
      setIsLoading(false);
    }
  };

  if (!store) return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin inline-block p-3 bg-blue-100 rounded-full mb-4">
          <Store className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-gray-600 font-medium">Loading Store Profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/vendor')}
            className="rounded-full border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Store className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Store Profile</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your store details and branding</p>
            </div>
          </div>
        </div>

        {/* Store Information Section */}
        <Card className="p-8 mb-6 shadow-sm border-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> Store Information
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Name <span className="text-red-500">*</span></label>
              <Input 
                value={store.store_name || ''} 
                onChange={(e) => setStore({ ...store, store_name: e.target.value })} 
                placeholder="Enter your store name"
                className="text-base py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                value={store.description || ''} 
                onChange={(e) => setStore({ ...store, description: e.target.value })} 
                placeholder="Describe your store and what you sell"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone
                </label>
                <Input 
                  value={store.phone || ''} 
                  onChange={(e) => setStore({ ...store, phone: e.target.value })} 
                  placeholder="(555) 123-4567"
                  className="text-base py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Address
                </label>
                <Input 
                  value={store.address || ''} 
                  onChange={(e) => setStore({ ...store, address: e.target.value })} 
                  placeholder="123 Main St, City, State ZIP"
                  className="text-base py-2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selling Category *</label>
              <select
                value={store.selling_category || ""}
                onChange={(e) => setStore({ ...store, selling_category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
              {store.selling_category_name && (
                <p className="mt-1 text-xs text-gray-500">Current: {store.selling_category_name}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Logo Section */}
        <Card className="p-8 mb-8 shadow-sm border-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-600" /> Store Logo
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition bg-white">
              <div className="space-y-2 text-center">
                <div className="flex justify-center">
                  <Upload className="h-8 w-8 text-green-500" />
                </div>
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">PNG, JPG or GIF (max. 2MB)</span>
                {store.logoFile && <p className="text-xs text-green-600 font-medium">✓ {store.logoFile.name}</p>}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setStore({ ...store, logoFile: e.target.files?.[0] })} 
                hidden
              />
            </label>

            {store.logo && !store.logoFile && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Current Logo:</p>
                <p className="text-sm font-medium text-gray-900">{store.logo}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={() => navigate('/vendor')}
            className="px-6 py-2.5 text-base border-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="px-6 py-2.5 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg flex items-center gap-2"
          >
            {isLoading ? (
              <><Save className="h-4 w-4" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
