import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditor = ({ isOpen, onClose }: ProfileEditorProps) => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<any>({
    store_name: "",
    description: "",
    phone: "",
    address: "",
    email: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      // If user is a vendor, fetch vendor store. Otherwise attempt to fetch user profile.
      if (user?.role === "VENDOR") {
        const res = await api.get<any>("/vendors/my_store/");
        if (res.success && res.data) {
          setProfile({
            store_name: res.data.store_name || "",
            description: res.data.description || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
            email: res.data.user?.email || res.data.email || "",
          });
        } else {
          toast.error("Failed to load vendor profile");
        }
      } else {
        // Try common profile endpoints; fall back to local user data
        let res = await api.get<any>("/auth/profile/");
        if (!res.success) res = await api.get<any>("/users/me/");
        if (res.success && res.data) {
          setProfile({
            email: res.data.email || user?.email || "",
            name: res.data.name || res.data.first_name || user?.name || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
          });
        } else {
          // fallback to client-stored user
          setProfile({
            email: user?.email || "",
            name: user?.name || user?.first_name || "",
            phone: "",
            address: "",
          });
        }
      }
    } catch (err) {
      toast.error("Error loading profile");
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (user?.role === "VENDOR") {
        if (!profile.store_name.trim() || !profile.phone.trim() || !profile.address.trim()) {
          toast.error("Please fill in all required fields");
          setIsLoading(false);
          return;
        }

        const res = await api.patch<any>("/vendors/my_store/", {
          store_name: profile.store_name,
          description: profile.description,
          phone: profile.phone,
          address: profile.address,
        });

        if (res.success) {
          toast.success("Profile updated successfully!");
          onClose();
        } else {
          toast.error(res.error || "Failed to update profile");
        }
      } else {
        // CUSTOMER profile update - try common endpoints and update local auth state
        const payload: any = {
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        };

        let res = await api.patch<any>("/auth/profile/", payload);
        if (!res.success) res = await api.patch<any>("/users/me/", payload);

        if (res.success) {
          // update local auth user if available
          try {
            updateUser?.({ email: profile.email, name: profile.name });
          } catch (e) {
            // fallback to localStorage update
            const stored = localStorage.getItem("user");
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.email = profile.email;
              parsed.name = profile.name;
              localStorage.setItem("user", JSON.stringify(parsed));
            }
          }
          toast.success("Profile updated successfully!");
          onClose();
        } else {
          toast.error(res.error || "Failed to update profile");
        }
      }
    } catch (err) {
      toast.error("Error saving profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">{user?.role === "VENDOR" ? "Edit Vendor Profile" : "Edit Profile"}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isFetching ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          ) : (
            <>
              {user?.role === "VENDOR" ? (
                <>
                  <div className="space-y-2">
                    <Label>Email (Read-only)</Label>
                    <Input disabled value={profile.email} className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_name">Store Name *</Label>
                    <Input
                      id="store_name"
                      value={profile.store_name}
                      onChange={(e) => setProfile({ ...profile, store_name: e.target.value })}
                      placeholder="Your Store Name"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Store Description</Label>
                    <textarea
                      id="description"
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      placeholder="Tell us about your store..."
                      disabled={isLoading}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your full name"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Optional phone"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Optional address"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
