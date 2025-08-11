import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function PermissionsTest() {
  const { user } = useUser();
  const userRecord = useQuery(api.users.getCurrentUser);
  const adminProfile = useQuery(
    api.permissions.getAdminProfile,
    user?.id ? { userId: user.id } : "skip"
  );
  const hasSystemSettingsPermission = useQuery(
    api.permissions.checkAdminPermission,
    user?.id ? { userId: user.id, permission: "system_settings" } : "skip"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions Test</h1>
          <p className="text-muted-foreground">
            Test current user permissions for system settings
          </p>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current User Information
          </CardTitle>
          <CardDescription>
            Basic user authentication and database record
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clerk Authentication</p>
              <p className="text-sm text-muted-foreground">
                {user ? `Logged in as ${user.emailAddresses[0]?.emailAddress}` : "Not authenticated"}
              </p>
            </div>
            <Badge variant={user ? "default" : "destructive"}>
              {user ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Database Record</p>
              <p className="text-sm text-muted-foreground">
                {userRecord ? `User ID: ${userRecord._id}` : "No database record found"}
              </p>
            </div>
            <Badge variant={userRecord ? "default" : "destructive"}>
              {userRecord ? "Found" : "Not Found"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">User Role</p>
              <p className="text-sm text-muted-foreground">
                {userRecord?.role || "No role assigned"}
              </p>
            </div>
            <Badge variant={userRecord?.role ? "default" : "secondary"}>
              {userRecord?.role || "None"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Admin Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Status
          </CardTitle>
          <CardDescription>
            Administrator privileges and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Admin Profile</p>
              <p className="text-sm text-muted-foreground">
                {adminProfile ? `Role: ${adminProfile.role}` : "No admin privileges"}
              </p>
            </div>
            <Badge variant={adminProfile ? "default" : "destructive"}>
              {adminProfile ? "Admin" : "Not Admin"}
            </Badge>
          </div>

          {adminProfile && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Admin Permissions</p>
                <p className="text-sm text-muted-foreground">
                  {adminProfile.permissions?.length || 0} permissions granted
                </p>
              </div>
              <Badge variant="outline">
                {adminProfile.permissions?.length || 0}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System Settings Permission</p>
              <p className="text-sm text-muted-foreground">
                Required to access system settings page
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasSystemSettingsPermission ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={hasSystemSettingsPermission ? "default" : "destructive"}>
                {hasSystemSettingsPermission ? "Granted" : "Denied"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions List */}
      {adminProfile && adminProfile.permissions && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Permissions</CardTitle>
            <CardDescription>
              All permissions granted to this admin user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {adminProfile.permissions.map((permission: string) => (
                <Badge 
                  key={permission} 
                  variant={permission === "system_settings" ? "default" : "outline"}
                  className="justify-center"
                >
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="space-y-2 text-sm">
            <p><strong>If you see "Not Admin":</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Visit <code>/admin-setup</code> to grant admin privileges</li>
              <li>Make sure you're logged in with the correct account</li>
            </ul>
            
            <p className="mt-4"><strong>If you see "System Settings Permission Denied":</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your admin role might not include system_settings permission</li>
              <li>Try promoting yourself to super_admin role</li>
              <li>Check the permissions.ts file for role configurations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}