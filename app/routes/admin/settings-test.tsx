import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Settings, Database } from "lucide-react";

export default function AdminSettingsTest() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings (Test)</h1>
            <p className="text-muted-foreground">
              Test page for system settings functionality
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings (Test)</h1>
          <p className="text-muted-foreground">
            Test page for system settings functionality
          </p>
        </div>
      </div>

      {/* Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Settings Test
          </CardTitle>
          <CardDescription>
            Basic test to verify the settings page structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Page Status</p>
              <p className="text-sm text-muted-foreground">Settings page loaded successfully</p>
            </div>
            <Badge variant="default" className="bg-green-500">Working</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Components</p>
              <p className="text-sm text-muted-foreground">UI components rendering correctly</p>
            </div>
            <Badge variant="default" className="bg-green-500">OK</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Next Step</p>
              <p className="text-sm text-muted-foreground">Fix Convex integration and test full functionality</p>
            </div>
            <Badge variant="outline">Pending</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
          <CardDescription>
            Steps to test the system settings functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">1. Basic Page Load</h4>
              <p className="text-sm text-muted-foreground">
                ✅ This page loads without errors - basic React components are working
              </p>
            </div>
            <div>
              <h4 className="font-medium">2. Fix Convex Integration</h4>
              <p className="text-sm text-muted-foreground">
                🔧 Need to ensure Convex is properly connected and API calls work
              </p>
            </div>
            <div>
              <h4 className="font-medium">3. Test Full Settings Page</h4>
              <p className="text-sm text-muted-foreground">
                📋 Once Convex is working, test the full settings functionality at /admin/settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}