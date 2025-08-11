import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "~/hooks/use-toast";
import { Textarea } from "~/components/ui/textarea";

interface UserEditFormProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserEditForm({ userId, isOpen, onClose }: UserEditFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isActive: true,
    role: "user" as "user" | "admin" | "super_admin" | "support",
    retell_api_key: "",
    user_agent_json_text: "",
  });

  // Get user details
  const userDetail = useQuery(
    api.users.getUserDetail,
    userId && user?.id ? { adminId: user.id, userId } : "skip"
  );

  // Mutations
  const updateUserStatus = useMutation(api.users.updateUserStatus);
  const promoteUserToAdmin = useMutation(api.admin.promoteUserToAdmin);
  const revokeAdminAccess = useMutation(api.admin.revokeAdminAccess);
  const updateUserRetellApiKey = useMutation(api.users.updateUserRetellApiKey);
  const updateUserAgentJson = useMutation(api.users.updateUserAgentJson);

  // Update form data when user details load
  useEffect(() => {
    if (userDetail) {
      setFormData({
        name: userDetail.name || "",
        email: userDetail.email || "",
        isActive: userDetail.isActive !== false,
        role: userDetail.adminRecord?.role || userDetail.role || "user",
        retell_api_key: userDetail.retell_api_key || "",
        user_agent_json_text: userDetail.user_agent_json ? JSON.stringify(userDetail.user_agent_json, null, 2) : "",
      });
    }
  }, [userDetail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submit triggered", { userId, userDetail, formData });
    
    if (!userId || !user?.id) {
      console.log("Missing userId or user.id", { userId, userIdFromUser: user?.id });
      return;
    }

    setIsLoading(true);

    try {
      // Update user status if changed
      const currentActiveStatus = userDetail?.isActive !== false;
      console.log("Status check:", { currentActiveStatus, formDataActive: formData.isActive });
      
      if (formData.isActive !== currentActiveStatus) {
        console.log("Updating user status...");
        await updateUserStatus({
          adminId: user.id,
          userId,
          isActive: formData.isActive,
          reason: `Status ${formData.isActive ? "activated" : "deactivated"} by admin`,
        });
        console.log("User status updated successfully");
      }

      // Handle role changes
      const currentRole = userDetail?.adminRecord?.role || userDetail?.role || "user";
      console.log("Role check:", { currentRole, formDataRole: formData.role });
      
      if (formData.role !== currentRole) {
        console.log("Updating user role...");
      
        if (formData.role === "user" && currentRole !== "user") {
          // Demote from admin to user
          await revokeAdminAccess({
            targetUserId: userId,
            revokedBy: user.id,
            reason: "Role changed to user by admin",
          });
        } else if (formData.role !== "user" && currentRole === "user") {
          // Promote user to admin
          await promoteUserToAdmin({
            targetUserId: userId,
            role: formData.role,
            promotedBy: user.id,
          });
        } else if (formData.role !== "user" && currentRole !== "user") {
          // Update admin role (would need additional mutation)
          console.warn("Role update between admin roles not implemented");
        }
      }

      // Update Retell API key if changed
      const currentApiKey = userDetail?.retell_api_key || "";
      console.log("API key check:", { currentApiKey, formDataApiKey: formData.retell_api_key });
      
      if (formData.retell_api_key !== currentApiKey) {
        console.log("Updating Retell API key...");
        await updateUserRetellApiKey({
          adminId: user.id,
          userId,
          retell_api_key: formData.retell_api_key,
        });
        console.log("Retell API key updated successfully");
      }

      // Update user_agent_json if changed
      const currentUserAgentJsonText = userDetail?.user_agent_json ? JSON.stringify(userDetail.user_agent_json, null, 2) : "";
      if (formData.user_agent_json_text !== currentUserAgentJsonText) {
        let parsed: any = null;
        if (formData.user_agent_json_text.trim().length > 0) {
          try {
            parsed = JSON.parse(formData.user_agent_json_text);
          } catch (e) {
            toast({
              title: "JSON parse failed",
              description: "Please ensure the user_agent_json text is valid JSON.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        await updateUserAgentJson({
          adminId: user.id,
          userId,
          user_agent_json: parsed,
        });
      }

      console.log("All updates completed successfully");
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form data
    setFormData({
      name: "",
      email: "",
      isActive: true,
      role: "user",
      retell_api_key: "",
      user_agent_json_text: "",
    });
  };

  if (!userDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Loading user details...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User name"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Name is managed by the authentication provider
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by the authentication provider
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {/* Only super admins can create other super admins */}
                {user && userDetail?.adminRecord?.role === "super_admin" && (
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retell_api_key">Retell API Key</Label>
            <Input
              id="retell_api_key"
              type="password"
              value={formData.retell_api_key}
              onChange={(e) => setFormData({ ...formData, retell_api_key: e.target.value })}
              placeholder="Enter Retell API Key (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Used for Retell AI voice integration. Leave empty to remove existing key.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user_agent_json">User Agent JSON</Label>
            <Textarea
              id="user_agent_json"
              rows={8}
              value={formData.user_agent_json_text}
              onChange={(e) => setFormData({ ...formData, user_agent_json_text: e.target.value })}
              placeholder={`Paste JSON here (optional). Example:\n{\n  "foo": 1,\n  "bar": ["x", "y"]\n}`}
            />
            <p className="text-xs text-muted-foreground">
              Stores JSON associated with this user. It will be displayed read-only on the details page. Leave empty to clear.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="status">Account Status</Label>
              <div className="text-sm text-muted-foreground">
                Active users can sign in and use the application
              </div>
            </div>
            <Switch
              id="status"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {/* Current Status Display */}
          <div className="rounded-lg border p-3 space-y-2">
            <Label className="text-sm font-medium">Current Information</Label>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{userId}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Role:</span>
                <Badge variant="outline" className="capitalize">
                  {userDetail.adminRecord?.role || userDetail.role || "user"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge variant={userDetail.isActive === false ? "destructive" : "default"}>
                  {userDetail.isActive === false ? "Inactive" : "Active"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>
                  {userDetail.createdAt
                    ? new Date(userDetail.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Retell API Key:</span>
                <Badge variant={userDetail.retell_api_key ? "default" : "outline"}>
                  {userDetail.retell_api_key ? "Configured" : "Not Set"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}