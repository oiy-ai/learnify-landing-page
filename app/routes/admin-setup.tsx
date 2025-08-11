import { useState } from "react";
import { useMutation } from "convex/react";
import { useAuth, useUser } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, User } from "lucide-react";
import { api } from "../../convex/_generated/api";

export default function AdminSetup() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [adminStatus, setAdminStatus] = useState<any>(null);

  const createFirstAdmin = useMutation(api.setup.createFirstAdmin);
  const checkCurrentUserAdmin = useMutation(api.setup.checkCurrentUserAdmin);

  const handleCreateAdmin = async () => {
    if (!userId) return;

    setIsCreating(true);
    try {
      const result = await createFirstAdmin({
        userId,
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName || user?.firstName || "Admin User",
      });
      setSetupResult(result);
    } catch (error: any) {
      setSetupResult({
        success: false,
        message: error.message || "Failed to create admin user",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!userId) return;

    try {
      const status = await checkCurrentUserAdmin({ userId });
      setAdminStatus(status);
    } catch (error) {
      console.error("Failed to check admin status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Setup</h1>
          <p className="text-gray-600 mt-2">
            Set up your first administrator account to access the admin panel
          </p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="font-medium">{user?.fullName || user?.firstName || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="font-medium">{user?.primaryEmailAddress?.emailAddress || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">User ID:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {userId?.slice(0, 20)}...
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Admin Status Check */}
        <Card>
          <CardHeader>
            <CardTitle>Check Admin Status</CardTitle>
            <CardDescription>
              Check if you already have admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleCheckStatus} variant="outline" className="w-full">
              Check Current Status
            </Button>

            {adminStatus && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Admin Status:</span>
                    <Badge variant={adminStatus.isAdmin ? "default" : "secondary"}>
                      {adminStatus.isAdmin ? "Admin" : "Regular User"}
                    </Badge>
                  </div>
                  {adminStatus.isAdmin && (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Admin Role:</span>
                        <Badge variant="outline">{adminStatus.adminRole}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Permissions:</span>
                        <span className="text-sm">{adminStatus.permissions.length} permissions</span>
                      </div>
                    </>
                  )}
                </div>

                {adminStatus.isAdmin && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">You already have admin access!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You can access the admin panel at <a href="/admin" className="underline">/admin</a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Admin */}
        {(!adminStatus || !adminStatus.isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle>Create First Admin</CardTitle>
              <CardDescription>
                This will create the first administrator account. This can only be done once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Important Notes:</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• This will grant you full administrator privileges</li>
                      <li>• Only one first admin can be created</li>
                      <li>• You can create additional admins later through the admin panel</li>
                      <li>• Make sure you're logged in with the correct account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreateAdmin}
                disabled={isCreating || !userId}
                className="w-full"
                size="lg"
              >
                {isCreating ? "Creating Admin..." : "Create First Admin Account"}
              </Button>

              {setupResult && (
                <div className={`p-4 border rounded-lg ${setupResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                  }`}>
                  <div className={`flex items-center gap-2 ${setupResult.success ? "text-green-800" : "text-red-800"
                    }`}>
                    {setupResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {setupResult.success ? "Success!" : "Error"}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${setupResult.success ? "text-green-700" : "text-red-700"
                    }`}>
                    {setupResult.message}
                  </p>
                  {setupResult.success && (
                    <div className="mt-3">
                      <Button asChild>
                        <a href="/admin">Go to Admin Panel</a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>If you're having trouble setting up admin access:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Make sure you're logged in with the correct account</li>
                <li>Check that your Convex deployment is running</li>
                <li>Verify your environment variables are set correctly</li>
                <li>If an admin already exists, ask them to grant you access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}