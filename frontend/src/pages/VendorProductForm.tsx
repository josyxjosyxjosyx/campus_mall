import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Trash2, Plus, Upload, Edit, FileText, Images, Layers, Settings, Save, Check } from "lucide-react";
import ColorInput from "@/components/ColorInput";
import CouponInput from "@/components/CouponInput";

const VendorProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorStore, setVendorStore] = useState<any>(null);

  const [product, setProduct] = useState<any>({
    name: "",
    price: "",
    shipping_fee: "",
    description: "",
    stock_quantity: "",
    category: "",
    imageFile: null as File | null,
    galleryFiles: [] as File[],
    is_featured: false,
    is_active: true,
  });

  const [variations, setVariations] = useState<Array<any>>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const [catRes, storeRes] = await Promise.all([api.getCategories(), api.getMyStore()]);
      if (catRes.success && catRes.data) {
        const payload: any = catRes.data as any;
        const items = Array.isArray(payload) ? payload : payload.results || [];
        if (storeRes.success && storeRes.data && (storeRes.data as any).selling_category) {
          const allowedId = Number((storeRes.data as any).selling_category);
          setCategories(items.filter((c: any) => Number(c.id) === allowedId));
        } else {
          setCategories(items);
        }
      }
      if (storeRes.success && storeRes.data) {
        const storePayload: any = storeRes.data;
        setVendorStore(storePayload);
        if (!isEdit && storePayload.selling_category) {
          setProduct((prev: any) => ({ ...prev, category: String(storePayload.selling_category) }));
        }
      }
    };
    fetchCategories();
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      const res = await api.getProduct(String(id));
      if (res.success && res.data) {
        const p = res.data as any;
        setProduct({
          name: p.name || "",
          price: String(p.price || ""),
          shipping_fee: String(p.shipping_fee || ""),
          description: p.description || "",
          stock_quantity: String(p.stock_quantity || "0"),
          category: p.category || "",
          imageFile: null,
          galleryFiles: [],
          is_featured: !!p.is_featured,
          is_active: !!p.is_active,
        });
        setVariations((p.variations || []).map((v: any) => ({
          id: v.id,
          sku: v.sku || '',
          price: v.price != null ? String(v.price) : '',
          size: v.attributes?.size || '',
          color: v.attributes?.color || '',
          attributes: v.attributes ? JSON.stringify(v.attributes) : '',
          stock_quantity: v.stock_quantity || '',
          images: [],
        })));
      }
    };
    fetchProduct();
  }, [id, isEdit]);

  const validateVariation = (v: any) => {
    if (v.price && isNaN(Number(v.price))) return 'Invalid variation price';
    if (v.stock_quantity && (isNaN(Number(v.stock_quantity)) || Number(v.stock_quantity) < 0)) return 'Invalid variation stock';
    return null;
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !product.stock_quantity) {
      toast.error('Please fill required fields');
      return;
    }
    if (!product.category) {
      toast.error('Please select a category');
      return;
    }
    if (vendorStore?.selling_category && Number(product.category) !== Number(vendorStore.selling_category)) {
      toast.error(`You can only add products in ${vendorStore.selling_category_name || "your assigned category"}`);
      return;
    }
    
    // Validate numeric fields
    if (isNaN(Number(product.price)) || Number(product.price) < 0) {
      toast.error('Invalid price');
      return;
    }
    if (product.shipping_fee && (isNaN(Number(product.shipping_fee)) || Number(product.shipping_fee) < 0)) {
      toast.error('Invalid shipping fee');
      return;
    }
    
    for (const v of variations) {
      const err = validateVariation(v);
      if (err) { toast.error(err); return; }
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('price', String(product.price));
      formData.append('shipping_fee', String(product.shipping_fee || '0'));
      formData.append('description', product.description || '');
      formData.append('stock_quantity', String(product.stock_quantity));
      formData.append('category', String(product.category));
      formData.append('is_featured', String(product.is_featured || false));
      formData.append('is_active', String(product.is_active || false));
      if (product.imageFile) formData.append('image', product.imageFile);
      // gallery
      for (const f of (product.galleryFiles || [])) formData.append('images', f);

      if (variations && variations.length) {
        const payload = variations.map((v) => {
          let attrs: any = {};
          if (v.size) attrs.size = v.size;
          if (v.color) attrs.color = v.color;
          if (v.attributes) {
            try { Object.assign(attrs, JSON.parse(v.attributes)); } catch(e) { /* ignore */ }
          }
          return {
            id: v.id || undefined,
            sku: v.sku || null,
            price: v.price ? parseFloat(v.price) : null,
            attributes: attrs,
            stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : 0,
            manage_stock: true,
            allow_backorders: false,
            is_active: true,
          };
        });
        formData.append('variations', JSON.stringify(payload));
        variations.forEach((v, idx) => {
          if (v.images && v.images.length) {
            v.images.forEach((f: File) => formData.append(`variation_images_${idx}`, f));
          }
        });
      }

      let res;
      if (isEdit && id) {
        res = await api.updateProductFormData(String(id), formData);
      } else {
        res = await api.createProduct(formData);
      }

      if (!res.success) {
        toast.error(res.error || 'Failed to save product');
        return;
      }

      toast.success('Product saved');
      navigate('/vendor');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            {isEdit ? <Edit className="h-7 w-7 text-blue-600" /> : <Plus className="h-7 w-7 text-blue-600" />}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="text-gray-600 text-sm mt-1">Fill in the details below to {isEdit ? 'update' : 'create'} your product listing</p>
          </div>
        </div>

        {/* Basic Information Section */}
        <Card className="p-6 mb-6 shadow-sm border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <Input 
                placeholder="Enter product name" 
                value={product.name} 
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="text-base" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-600">$</span>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01"
                    value={product.price} 
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    className="pl-7 text-base" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-600">$</span>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01"
                    value={product.shipping_fee} 
                    onChange={(e) => setProduct({ ...product, shipping_fee: e.target.value })}
                    className="pl-7 text-base" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="0" 
                  type="number" 
                  value={product.stock_quantity} 
                  onChange={(e) => setProduct({ ...product, stock_quantity: e.target.value })}
                  className="text-base" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={product.category} 
                onChange={(e) => setProduct({ ...product, category: e.target.value })} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                disabled={!!vendorStore?.selling_category}
              >
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {vendorStore?.selling_category_name && (
                <p className="mt-1 text-xs text-gray-500">
                  Your store category: {vendorStore.selling_category_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                placeholder="Describe your product in detail..." 
                value={product.description} 
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Media Section */}
        <Card className="p-6 mb-6 shadow-sm border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Images className="h-5 w-5 text-green-600" /> Media
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-6 w-6 text-blue-500" />
                  <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                  {product.imageFile && <p className="text-xs text-green-600">✓ {product.imageFile.name}</p>}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setProduct({ ...product, imageFile: e.target.files?.[0] || null })} 
                  hidden
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-50 transition">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-6 w-6 text-green-500" />
                  <span className="text-sm text-gray-600">Upload multiple images</span>
                  {product.galleryFiles.length > 0 && <p className="text-xs text-green-600">✓ {product.galleryFiles.length} file(s) selected</p>}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => setProduct({ ...product, galleryFiles: Array.from(e.target.files || []) })} 
                  hidden
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Variations Section */}
        <Card className="p-6 mb-6 shadow-sm border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" /> Variations {variations.length > 0 && <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{variations.length}</span>}
          </h2>
          <div className="space-y-4">
            {variations.length === 0 ? (
              <p className="text-gray-500 text-sm">No variations yet. Add one to offer different options for your product.</p>
            ) : (
              variations.map((v, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">Variation {idx + 1}</span>
                    <Button 
                      size="sm"
                      variant="destructive" 
                      onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                      <select 
                        value={v.size || ''} 
                        onChange={(e) => { const c = [...variations]; c[idx] = { ...c[idx], size: e.target.value }; setVariations(c); }} 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                      <ColorInput
                        value={v.color || ''}
                        onChange={(color) => {
                          const c = [...variations];
                          c[idx] = { ...c[idx], color };
                          setVariations(c);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <Input 
                      placeholder="SKU (e.g., SHIRT-BLU-M)" 
                      value={v.sku || ''} 
                      onChange={(e) => { const c = [...variations]; c[idx] = { ...c[idx], sku: e.target.value }; setVariations(c); }} 
                      className="text-sm"
                    />
                    <Input 
                      placeholder="Price override (optional)" 
                      type="number" 
                      step="0.01"
                      value={v.price || ''} 
                      onChange={(e) => { const c = [...variations]; c[idx] = { ...c[idx], price: e.target.value }; setVariations(c); }} 
                      className="text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <Input 
                      placeholder="Stock Quantity for this variation" 
                      type="number" 
                      value={v.stock_quantity || ''} 
                      onChange={(e) => { const c = [...variations]; c[idx] = { ...c[idx], stock_quantity: e.target.value }; setVariations(c); }} 
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Variation Images</label>
                    <label className="flex items-center justify-center w-full px-3 py-3 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-5 w-5 text-purple-500" />
                        <span className="text-xs text-gray-600">Upload images for this variation</span>
                        {v.images && v.images.length > 0 && <p className="text-xs text-green-600">✓ {v.images.length} file(s)</p>}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={(e) => { const c = [...variations]; c[idx] = { ...c[idx], images: Array.from(e.target.files || []) }; setVariations(c); }} 
                        hidden
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
            <Button 
              onClick={() => setVariations([...variations, {}])}
              variant="outline"
              className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Variation
            </Button>
          </div>
        </Card>

        {/* Coupons Section */}
        <Card className="p-6 mb-6 shadow-sm border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" /> Promotions & Discounts
          </h2>
          <CouponInput 
            productIds={id ? [parseInt(id)] : []}
            onChange={(coupons) => setSelectedCoupons(coupons)}
          />
        </Card>

        {/* Settings Section */}
        <Card className="p-6 mb-6 shadow-sm border-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" /> Settings
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                id="featured"
                checked={product.is_featured}
                onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="featured" className="flex-1 cursor-pointer">
                <span className="font-medium text-gray-900">Featured Product</span>
                <p className="text-xs text-gray-500">Display prominently on marketplace</p>
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input 
                type="checkbox" 
                id="active"
                checked={product.is_active}
                onChange={(e) => setProduct({ ...product, is_active: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded cursor-pointer"
              />
              <label htmlFor="active" className="flex-1 cursor-pointer">
                <span className="font-medium text-gray-900">Active / Publish</span>
                <p className="text-xs text-gray-500">Make this product visible to customers</p>
              </label>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mb-8">
          <Button 
            onClick={() => navigate('/vendor')} 
            variant="outline"
            className="px-6 py-2 text-base"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="px-6 py-2 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg flex items-center gap-2"
          >
            {isLoading ? (
              <><Save className="h-4 w-4" /> Saving...</>
            ) : (
              <><Check className="h-4 w-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorProductForm;
