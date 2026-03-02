import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Address {
  id: number;
  label: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export const AddressesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAddresses();
  }, [user, navigate]);

  const fetchAddresses = async () => {
    setIsFetching(true);
    setApiError(null);
    try {
      const response = await api.getAddresses();
      console.log("[ADDRESSES] Fetch response:", response);
      
      if (response.success && response.data) {
        console.log("[ADDRESSES] Response data:", response.data);
        console.log("[ADDRESSES] Is array:", Array.isArray(response.data));
        console.log("[ADDRESSES] Has results:", (response.data as any)?.results);
        
        const addressList = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.results || [];
        
        console.log("[ADDRESSES] Extracted address list:", addressList);
        setAddresses(addressList);
      } else {
        console.warn("[ADDRESSES] API response not successful:", response);
        const errorMsg = response.error || "Failed to load addresses";
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to load addresses";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'label',
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'address_line1',
      'city',
      'state',
      'postal_code',
      'country',
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.toString().trim()) {
        toast.error(`Please fill in all required fields`);
        return false;
      }
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);
    try {
      console.log("[ADDRESSES] Creating address with data:", formData);
      const response = await api.createAddress(formData);
      console.log("[ADDRESSES] Create response:", response);
      
      if (response.success) {
        toast.success("Address added successfully");
        resetForm();
        // Give the database a moment to persist
        await new Promise(resolve => setTimeout(resolve, 300));
        fetchAddresses();
      } else {
        const errorMsg = response.error || "Failed to add address";
        console.error("[ADDRESSES] Create failed:", response);
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add address";
      console.error("Failed to add address:", error);
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async (id: number) => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.updateAddress(String(id), formData);
      if (response.success) {
        toast.success("Address updated successfully");
        resetForm();
        fetchAddresses();
      } else {
        toast.error(response.error || "Failed to update address");
      }
    } catch (error) {
      console.error("Failed to update address:", error);
      toast.error("Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    setIsLoading(true);
    try {
      const response = await api.deleteAddress(String(id));
      if (response.success) {
        toast.success("Address deleted");
        fetchAddresses();
      } else {
        toast.error(response.error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error("Failed to delete address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await api.updateAddress(String(id), { is_default: true });
      if (response.success) {
        toast.success("Default address updated");
        fetchAddresses();
      } else {
        toast.error(response.error || "Failed to set default address");
      }
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast.error("Failed to set default address");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (address: Address) => {
    setFormData({
      label: address.label,
      first_name: address.first_name,
      last_name: address.last_name,
      email: address.email,
      phone_number: address.phone_number,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    });
    setEditingId(address.id);
    setIsAddingNew(false);
  };

  const resetForm = () => {
    setFormData({
      label: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    });
    setEditingId(null);
    setIsAddingNew(false);
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-4xl font-bold text-foreground">Your Addresses</h1>
          </div>
          <p className="text-muted-foreground">Manage your shipping addresses for faster checkout</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-900 mb-2">Error:</p>
            <p className="text-red-800">{apiError}</p>
            <p className="text-red-700 text-sm mt-2">
              Check your browser console (F12) for more details. Make sure you're logged in.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add/Edit Form - Left Side */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 border">
              <h2 className="font-bold text-lg text-foreground mb-4">
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>

              <div className="space-y-4">
                {/* Address Label */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Address Label *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Home, Work, Dorm"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {/* Personal Information */}
                <hr className="my-2" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Mobile Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {/* Address Information */}
                <hr className="my-2" />
                <h3 className="text-sm font-semibold text-foreground">Address</h3>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Address Line 1 *
                  </label>
                  <Input
                    type="text"
                    placeholder="Street address"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Address Line 2
                  </label>
                  <Input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {/* Location Information */}
                <hr className="my-2" />
                <h3 className="text-sm font-semibold text-foreground">Location</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      City *
                    </label>
                    <Input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      State *
                    </label>
                    <Input
                      type="text"
                      placeholder="State / Province"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Zip Code *
                    </label>
                    <Input
                      type="text"
                      placeholder="Postal code / ZIP"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Country *
                    </label>
                    <Input
                      type="text"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => (editingId ? handleUpdateAddress(editingId) : handleAddAddress())}
                    disabled={isLoading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? "Saving..." : editingId ? "Update Address" : "Save Address"}
                  </Button>
                  {(editingId || isAddingNew) && (
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Address List - Right Side */}
          <div className="lg:col-span-2">
            {isFetching ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <Card className="p-12 text-center border">
                <p className="text-muted-foreground mb-4">No saved addresses yet.</p>
                <p className="text-sm text-muted-foreground">
                  Add your first address to get started with faster checkout
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className={`p-6 border transition-all cursor-pointer hover:shadow-md ${
                      address.is_default ? "border-primary bg-primary/5 ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-foreground">{address.label}</h3>
                          {address.is_default && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {address.first_name} {address.last_name}
                        </p>
                        <p className="text-sm text-foreground mb-1">{address.email}</p>
                        <p className="text-sm text-foreground mb-2">{address.phone_number}</p>
                        <p className="text-sm text-foreground mb-1">
                          {address.address_line1}
                          {address.address_line2 && ` ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.postal_code}, {address.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {!address.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(address)}
                        disabled={isLoading}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={isLoading}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressesPage;
