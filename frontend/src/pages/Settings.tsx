import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    order_updates: true,
    promotional_emails: false,
    security_alerts: true,
    new_product_alerts: false,
    review_reminders: true,
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

  const handleProfileSave = async () => {
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
      const url = (import.meta.env.VITE_API_URL || "http://localhost:8000/api") + "/auth/profile/";

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

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement password change endpoint
      // For now, show a placeholder message
      toast.info("Password change functionality will be implemented soon");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement notification preferences endpoint
      toast.success("Notification preferences saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
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
              <Shield className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">First Name</Label>
                  <Input
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="Enter your first name"
                    className="text-base py-2.5"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Last Name</Label>
                  <Input
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Enter your last name"
                    className="text-base py-2.5"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email Address
                </Label>
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
                  <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Phone className="h-4 w-4" /> Phone Number
                  </Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="text-base py-2.5"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Username</Label>
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
                <Label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Address
                </Label>
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  className="text-base py-2.5"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg flex items-center gap-2"
                >
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className="text-base py-2.5 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Enter new password"
                    className="text-base py-2.5 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    className="text-base py-2.5 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-base bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg flex items-center gap-2"
                >
                  {isLoading ? (
                    <>Changing...</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Change Password</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Order Updates</Label>
                    <p className="text-xs text-gray-500">Receive notifications about your order status</p>
                  </div>
                  <Switch
                    checked={notifications.order_updates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, order_updates: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Security Alerts</Label>
                    <p className="text-xs text-gray-500">Important security notifications for your account</p>
                  </div>
                  <Switch
                    checked={notifications.security_alerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, security_alerts: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Review Reminders</Label>
                    <p className="text-xs text-gray-500">Reminders to review products you've purchased</p>
                  </div>
                  <Switch
                    checked={notifications.review_reminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, review_reminders: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">New Product Alerts</Label>
                    <p className="text-xs text-gray-500">Notifications about new products from vendors you follow</p>
                  </div>
                  <Switch
                    checked={notifications.new_product_alerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, new_product_alerts: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Promotional Emails</Label>
                    <p className="text-xs text-gray-500">Marketing emails and special offers</p>
                  </div>
                  <Switch
                    checked={notifications.promotional_emails}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, promotional_emails: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNotificationSave}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-base bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-lg flex items-center gap-2"
                >
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <><Bell className="h-4 w-4" /> Save Preferences</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 text-base border-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;