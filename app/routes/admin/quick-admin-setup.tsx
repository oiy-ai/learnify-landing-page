import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, User, Crown } from "lucide-react";

export default function QuickAdminSetup() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check current user status
  const userRecord = useQuery(api.users.getCurrentUser);
  const adminProfile = useQuery(
    api.permissions.getAdminProfile,
    user?.id ? { userId: user.id } : "skip"
  );

  // Mutation to create admin
  const initialAdminSetup = useMutation(api.admin.initialAdminSetup);

  const handlePromoteToAdmin = async () => {
    if (!user) {
      setMessage("Please log in first");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await initialAdminSetup({
        userId: user.id,
      });
      setMessage("✅ Successfully promoted to Super Admin!");
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Admin Setup</h1>
          <p className="text-muted-foreground">
            Quickly grant admin privileges to your account
          </p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            Your current account and permission status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Logged In</p>
              <p className="text-sm text-muted-foreground">
                {user ? user.emailAddresses[0]?.emailAddress : "Not logged in"}
              </p>
            </div>
            <Badge variant={user ? "default" : "destructive"}>
              {user ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Database Record</p>
              <p className="text-sm text-muted-foreground">
                {userRecord ? "User record exists" : "No user record"}
              </p>
            </div>
            <Badge variant={userRecord ? "default" : "secondary"}>
              {userRecord ? "Exists" : "Missing"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Admin Status</p>
              <p className="text-sm text-muted-foreground">
                {adminProfile ? `${adminProfile.role} with ${adminProfile.permissions?.length || 0} permissions` : "Not an admin"}
              </p>
            </div>
            <Badge variant={adminProfile ? "default" : "destructive"}>
              {adminProfile ? adminProfile.role : "Not Admin"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Grant Admin Privileges
          </CardTitle>
          <CardDescription>
            Click the button below to grant yourself super admin privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">Please log in with your Google account first</p>
            </div>
          )}

          {user && adminProfile && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800">You already have admin privileges!</p>
            </div>
          )}

          {user && !adminProfile && (
            <Button 
              onClick={handlePromoteToAdmin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isLoading ? "Granting Admin Privileges..." : "Grant Super Admin Privileges"}
            </Button>
          )}

          {message && (
            <div className={`p-4 rounded-md ${
              message.startsWith("✅") 
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <p>{message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            How to use this tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">1.</span>
              <p>Make sure you're logged in with your Google account</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">2.</span>
              <p>Click "Grant Super Admin Privileges" to add admin permissions to your account</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">3.</span>
              <p>Once successful, you can access all admin features including system settings</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">4.</span>
              <p>Visit <code>/admin/settings</code> to test the system settings functionality</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {adminProfile && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">🎉 Ready to Go!</CardTitle>
          </CardHeader>
          <CardContent className="text-green-800">
            <p className="mb-4">You now have admin privileges! You can:</p>
            <ul className="space-y-1 text-sm">
              <li>• Visit <code>/admin/settings</code> to configure system settings</li>
              <li>• Access <code>/admin/users</code> to manage users</li>
              <li>• View <code>/admin/analytics</code> for system analytics</li>
              <li>• Manage <code>/admin/products</code> and subscriptions</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}