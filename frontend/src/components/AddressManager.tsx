import { useState, useEffect } from "react";
import { Trash2, Edit2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Address {
  id: number;
  label: string;
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export const AddressManager = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    street_address: "",
    city: "",
    postal_code: "",
    country: "",
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.getAddresses();
      if (response.success && response.data) {
        const addressList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.results || [];
        setAddresses(addressList);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast.error("Failed to load addresses");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async () => {
    if (!formData.label.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.postal_code.trim() || !formData.country.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.createAddress(formData);
      if (response.success) {
        toast.success("Address added successfully");
        setFormData({ label: "", street_address: "", city: "", postal_code: "", country: "" });
        setIsAdding(false);
        fetchAddresses();
      } else {
        toast.error(response.error || "Failed to add address");
      }
    } catch (error) {
      console.error("Failed to add address:", error);
      toast.error("Failed to add address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async (id: number) => {
    if (!formData.label.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.postal_code.trim() || !formData.country.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.updateAddress(String(id), formData);
      if (response.success) {
        toast.success("Address updated successfully");
        setFormData({ label: "", street_address: "", city: "", postal_code: "", country: "" });
        setEditingId(null);
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
        toast.success("Address deleted successfully");
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
      street_address: address.street_address,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
    });
    setEditingId(address.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Saved Addresses</h3>
        <Button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setFormData({ label: "", street_address: "", city: "", postal_code: "", country: "" });
            }
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="p-6 bg-muted/50 border">
          <h4 className="font-bold text-foreground mb-4">
            {editingId ? "Edit Address" : "Add New Address"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Label</label>
              <Input
                type="text"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="e.g., Home, Work"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Street Address</label>
              <Input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">City</label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Postal Code</label>
              <Input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="Postal code"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Country</label>
              <Input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                editingId ? handleUpdateAddress(editingId) : handleAddAddress()
              }
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ label: "", street_address: "", city: "", postal_code: "", country: "" });
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No saved addresses. Add one to get started!
          </p>
        ) : (
          addresses.map((address) => (
            <Card
              key={address.id}
              className={`p-4 border ${
                address.is_default ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-foreground">{address.label}</h4>
                  {address.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded inline-block mt-1">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{address.street_address}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {address.city}, {address.postal_code}, {address.country}
              </p>
              <div className="flex gap-2">
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
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteAddress(address.id)}
                  disabled={isLoading}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressManager;
