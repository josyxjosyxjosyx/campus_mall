import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, Save, ArrowLeft } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        address: profile.address,
      };

      const token = localStorage.getItem("authToken");
      const url = (import.meta.env.VITE_API_URL || "http://localhost:8000/api") + "/users/profile/";
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="rounded-full border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your account information</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <Card className="p-8 mb-6 shadow-sm border-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" /> Profile Information
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input 
                  value={profile.first_name} 
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} 
                  placeholder="Enter your first name"
                  className="text-base py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input 
                  value={profile.last_name} 
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} 
                  placeholder="Enter your last name"
                  className="text-base py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email Address
              </label>
              <Input 
                type="email"
                value={profile.email} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                placeholder="your.email@example.com"
                className="text-base py-2.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone Number
                </label>
                <Input 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                  placeholder="(555) 123-4567"
                  className="text-base py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <Input 
                  value={profile.username} 
                  disabled
                  placeholder="Username"
                  className="text-base py-2.5 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Address
              </label>
              <Input 
                value={profile.address} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
                placeholder="123 Main St, City, State ZIP"
                className="text-base py-2.5"
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
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

export default Profile;
