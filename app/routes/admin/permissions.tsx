import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { 
  Shield, 
  Users, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Settings,
  ShieldCheck,
  UserCheck,
  Database,
  BarChart,
  Globe,
  Headphones,
  Info,
  RotateCcw,
  User
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/react-router";
import { toast } from "sonner";

// Type definitions
type Role = "admin" | "support" | "user";
type PermissionGroup = {
  label: string;
  permissions: Array<{
    key: string;
    value: string;
    label: string;
  }>;
};

// Icons for permission categories
const categoryIcons = {
  pageAccess: Globe,
  userDashboard: User,
  userContent: Settings,
  userSubscriptions: Database,
  userApi: Globe,
  userManagement: Users,
  subscriptions: Database,
  products: Settings,
  analytics: BarChart,
  system: Shield,
  support: Headphones,
};

export default function PermissionsManagement() {
  const { userId } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  // Queries
  const availablePermissions = useQuery(api.permissions.getAvailablePermissions);
  const rolePermissions = useQuery(api.permissions.getPermissionsForRoleTemplate, { role: selectedRole });

  // Mutations
  const updateRolePermissions = useMutation(api.permissions.updatePermissionsForRole);

  // Initialize selected permissions when role changes or data loads
  useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissions([...rolePermissions]);
      setHasChanges(false);
    }
  }, [rolePermissions]);

  // Handle permission toggle
  const handlePermissionToggle = (permission: string, checked: boolean) => {
    let newPermissions: string[];
    
    if (checked) {
      newPermissions = [...selectedPermissions, permission];
    } else {
      newPermissions = selectedPermissions.filter(p => p !== permission);
    }
    
    setSelectedPermissions(newPermissions);
    setHasChanges(JSON.stringify([...newPermissions].sort()) !== JSON.stringify([...(rolePermissions || [])].sort()));
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!hasChanges) return;
    
    setLoading(true);
    try {
      const result = await updateRolePermissions({
        role: selectedRole,
        permissions: selectedPermissions,
      });
      
      toast.success(`Successfully updated ${selectedRole} permissions`, {
        description: `Updated permissions for ${result.updatedCount} users with ${selectedRole} role`,
      });
      
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to update permissions", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    if (rolePermissions) {
      setSelectedPermissions([...rolePermissions]);
      setHasChanges(false);
    }
  };

  // Handle role change
  const handleRoleChange = (role: Role) => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to switch roles?");
      if (!confirm) return;
    }
    setSelectedRole(role);
  };

  if (!availablePermissions || !rolePermissions) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Permissions Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure page access and functional permissions for admin and support roles
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          </div>
        )}
      </div>

      {/* Warning Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Changes to role permissions will immediately affect all users with that role. 
          Super Admin permissions cannot be modified through this interface.
        </AlertDescription>
      </Alert>

      {/* Role Selection Tabs */}
      <Tabs value={selectedRole} onValueChange={(value) => handleRoleChange(value as Role)}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Role
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Support Role
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User Role
            </TabsTrigger>
          </TabsList>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={!hasChanges}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <TabsContent value="admin" className="space-y-6">
          <PermissionsByRole
            role="admin"
            permissionGroups={availablePermissions}
            selectedPermissions={selectedPermissions}
            onPermissionToggle={handlePermissionToggle}
          />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <PermissionsByRole
            role="support"
            permissionGroups={availablePermissions}
            selectedPermissions={selectedPermissions}
            onPermissionToggle={handlePermissionToggle}
          />
        </TabsContent>

        <TabsContent value="user" className="space-y-6">
          <PermissionsByRole
            role="user"
            permissionGroups={availablePermissions}
            selectedPermissions={selectedPermissions}
            onPermissionToggle={handlePermissionToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for displaying permissions by role
function PermissionsByRole({ 
  role, 
  permissionGroups, 
  selectedPermissions, 
  onPermissionToggle 
}: {
  role: Role;
  permissionGroups: Record<string, PermissionGroup>;
  selectedPermissions: string[];
  onPermissionToggle: (permission: string, checked: boolean) => void;
}) {
  const totalPermissions = Object.values(permissionGroups).reduce((sum, group) => sum + group.permissions.length, 0);
  const selectedCount = selectedPermissions.length;

  return (
    <div className="space-y-6">
      {/* Role Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {role === "admin" ? <Shield className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            {role === "admin" ? "Administrator" : "Support"} Role Summary
          </CardTitle>
          <CardDescription>
            Overview of permissions for the {role} role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
              <div className="text-sm text-muted-foreground">Assigned Permissions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-foreground">{totalPermissions}</div>
              <div className="text-sm text-muted-foreground">Total Available</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((selectedCount / totalPermissions) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(permissionGroups).map(([groupKey, group]) => {
          const IconComponent = categoryIcons[groupKey as keyof typeof categoryIcons] || Settings;
          const groupSelectedCount = group.permissions.filter(p => selectedPermissions.includes(p.value)).length;
          
          return (
            <Card key={groupKey} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    {group.label}
                  </div>
                  <Badge variant={groupSelectedCount === group.permissions.length ? "default" : "secondary"}>
                    {groupSelectedCount}/{group.permissions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.permissions.map((permission) => {
                  const isChecked = selectedPermissions.includes(permission.value);
                  
                  return (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${groupKey}-${permission.key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          onPermissionToggle(permission.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`${groupKey}-${permission.key}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="flex flex-col">
                          <span>{permission.label}</span>
                          <span className="text-xs text-muted-foreground font-mono">{permission.key}</span>
                        </div>
                      </Label>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Info className="h-3 w-3" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>{permission.label}</SheetTitle>
                            <SheetDescription>
                              Permission Details
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-4 space-y-4">
                            <div>
                          <Label className="text-sm font-medium">Permission Key</Label>
                          <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1">
                                {permission.value}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Category</Label>
                              <p className="text-sm text-muted-foreground mt-1">{group.label}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {isChecked ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm">
                                  {isChecked ? "Granted" : "Not Granted"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}