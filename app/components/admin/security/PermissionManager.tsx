import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Search, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";

interface PermissionManagerProps {
  adminId: string;
}

export function PermissionManager({ adminId }: PermissionManagerProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("users");

  // Queries
  const allUsers = useQuery(api.users.getAllUsers, { 
    adminId, 
    search: searchTerm,
    limit: 50 
  });
  const permissionGroups = useQuery(api.security.getPermissionGroups);
  const userPermissions = useQuery(
    api.security.getUserPermissions,
    selectedUser ? { userId: selectedUser } : "skip"
  );

  // Mutations
  const updatePermissions = useMutation(api.security.updateUserPermissions);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setSelectedPermissions([]);
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const handleSavePermissions = async (action: "add" | "remove" | "set") => {
    if (!selectedUser || selectedPermissions.length === 0) return;

    try {
      await updatePermissions({
        adminId,
        targetUserId: selectedUser,
        permissions: selectedPermissions,
        action,
      });
      
      setSelectedPermissions([]);
      // Show success message
    } catch (error) {
      console.error("Failed to update permissions:", error);
      // Show error message
    }
  };

  const filteredUsers = allUsers?.users?.filter(user => 
    user.adminRecord && user.adminRecord.isActive
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Permission Manager</h2>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permission Groups
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Permission Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Admin User
                </CardTitle>
                <CardDescription>
                  Choose an admin user to manage their permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admin users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* User List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser === user.tokenIdentifier
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleUserSelect(user.tokenIdentifier)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {user.adminRecord?.role || "admin"}
                          </Badge>
                          {selectedUser === user.tokenIdentifier && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permission Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Manage Permissions
                </CardTitle>
                <CardDescription>
                  {selectedUser 
                    ? "Add or remove permissions for the selected user"
                    : "Select a user to manage their permissions"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser ? (
                  <>
                    {/* Current Permissions */}
                    <div>
                      <Label className="text-sm font-medium">Current Permissions</Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {userPermissions?.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        )) || <p className="text-sm text-muted-foreground">Loading...</p>}
                      </div>
                    </div>

                    {/* Permission Groups */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Available Permissions</Label>
                      {permissionGroups?.map((group) => (
                        <div key={group.name} className="space-y-2">
                          <Label className="text-sm font-medium text-primary">
                            {group.displayName}
                          </Label>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {group.permissions.map((permission) => (
                              <div key={permission.key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission.key}
                                  checked={selectedPermissions.includes(permission.key)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(permission.key, checked as boolean)
                                  }
                                />
                                <Label 
                                  htmlFor={permission.key}
                                  className="text-sm cursor-pointer"
                                >
                                  {permission.displayName}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    {selectedPermissions.length > 0 && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleSavePermissions("add")}
                          size="sm"
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Add Permissions
                        </Button>
                        <Button
                          onClick={() => handleSavePermissions("remove")}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Remove Permissions
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="mx-auto h-8 w-8 mb-2" />
                    <p>Select an admin user to manage their permissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Permission Groups</CardTitle>
              <CardDescription>
                Overview of all permission groups and their included permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {permissionGroups?.map((group) => (
                  <div key={group.name} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{group.displayName}</h3>
                      <Badge variant="outline">{group.permissions.length} permissions</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-7">
                      {group.permissions.map((permission) => (
                        <Badge key={permission.key} variant="secondary" className="justify-start">
                          {permission.displayName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Permission Audit Trail
              </CardTitle>
              <CardDescription>
                Track all permission changes and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>Permission audit trail will be implemented in the next phase</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}