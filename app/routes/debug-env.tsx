import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "../../convex/_generated/api";

export default function DebugEnv() {
  const envCheck = useQuery(api.debug.checkEnvironmentVariables);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Environment Variables Debug</h1>
        <p className="text-muted-foreground">
          Check if Polar.sh environment variables are properly loaded
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Status</CardTitle>
        </CardHeader>
        <CardContent>
          {envCheck ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>POLAR_ACCESS_TOKEN:</span>
                  <Badge variant={envCheck.hasAccessToken ? "default" : "destructive"}>
                    {envCheck.hasAccessToken ? "✓ Set" : "✗ Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>POLAR_ORGANIZATION_ID:</span>
                  <Badge variant={envCheck.hasOrgId ? "default" : "destructive"}>
                    {envCheck.hasOrgId ? "✓ Set" : "✗ Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>POLAR_WEBHOOK_SECRET:</span>
                  <Badge variant={envCheck.hasWebhookSecret ? "default" : "destructive"}>
                    {envCheck.hasWebhookSecret ? "✓ Set" : "✗ Missing"}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Details:</h3>
                <div className="text-sm space-y-1">
                  <p>Access Token Length: {envCheck.accessTokenLength} chars</p>
                  <p>Organization ID Length: {envCheck.orgIdLength} chars</p>
                  <p>Webhook Secret Length: {envCheck.webhookSecretLength} chars</p>
                  <p>Access Token Prefix: {envCheck.accessTokenPrefix}</p>
                  <p>Org ID Prefix: {envCheck.orgIdPrefix}</p>
                </div>
              </div>

              {!envCheck.hasAccessToken || !envCheck.hasOrgId ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">Action Required:</h3>
                  <ol className="text-sm text-red-700 space-y-1">
                    <li>1. Make sure your .env.local file has the correct variables</li>
                    <li>2. Restart your Convex dev server: <code>npx convex dev</code></li>
                    <li>3. Restart your frontend dev server: <code>npm run dev</code></li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ All environment variables are properly configured!</p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading environment check...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>If environment variables are properly set:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Go to <a href="/admin-setup" className="text-blue-600 underline">/admin-setup</a> to create admin user</li>
              <li>Then visit <a href="/admin/polar-setup" className="text-blue-600 underline">/admin/polar-setup</a> to test connection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}