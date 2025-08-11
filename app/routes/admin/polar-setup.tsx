import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  RefreshCw
} from "lucide-react";
import { api } from "../../../convex/_generated/api";

export default function PolarSetup() {
  const { userId } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [polarOrgInfo, setPolarOrgInfo] = useState<any>(null);
  const [isLoadingOrgInfo, setIsLoadingOrgInfo] = useState(true);

  // Actions
  const getPolarOrgInfo = useAction(api.polarApi.getPolarOrganizationInfo);
  const testConnection = useAction(api.polarApi.testPolarConnection);

  const handleTestConnection = async () => {
    if (!userId) return;
    
    setIsTesting(true);
    try {
      const result = await testConnection({ adminId: userId });
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to test connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Load organization info on component mount
  useEffect(() => {
    const loadOrgInfo = async () => {
      if (!userId) return;
      
      setIsLoadingOrgInfo(true);
      try {
        const result = await getPolarOrgInfo({ adminId: userId });
        setPolarOrgInfo(result);
      } catch (error: any) {
        setPolarOrgInfo({
          configured: false,
          message: error.message || "Failed to load organization info",
        });
      } finally {
        setIsLoadingOrgInfo(false);
      }
    };

    loadOrgInfo();
  }, [userId, getPolarOrgInfo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Polar.sh Integration Setup</h1>
        <p className="text-muted-foreground">
          Configure your Polar.sh integration to sync products and manage subscriptions
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {polarOrgInfo?.configured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingOrgInfo ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : polarOrgInfo?.configured ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>API Credentials:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Configured
                </Badge>
              </div>
              
              {polarOrgInfo.organization && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {polarOrgInfo.organization.avatar_url && (
                      <img 
                        src={polarOrgInfo.organization.avatar_url} 
                        alt="Organization" 
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-green-800">
                        {polarOrgInfo.organization.name}
                      </p>
                      <p className="text-sm text-green-600">
                        @{polarOrgInfo.organization.slug}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {polarOrgInfo.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configuration found but API test failed: {polarOrgInfo.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {polarOrgInfo?.message || "Polar.sh API credentials not configured"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Test API Connection</CardTitle>
          <CardDescription>
            Test your Polar.sh API connection to ensure everything is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTestConnection} 
            disabled={isTesting || !polarOrgInfo?.configured}
            className="w-full sm:w-auto"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <div className={`flex items-start gap-2 ${
                testResult.success ? "text-green-800" : "text-red-800"
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {testResult.success ? "Connection Successful!" : "Connection Failed"}
                  </p>
                  <p className="text-sm mt-1">{testResult.message}</p>
                  {testResult.organization && (
                    <div className="mt-2 text-sm">
                      <p>Connected to: <strong>{testResult.organization.name}</strong></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!polarOrgInfo?.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to configure your Polar.sh integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Get your Polar.sh API credentials</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to your Polar.sh dashboard and create an API token
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="https://polar.sh/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Polar.sh Dashboard
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Set environment variables</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add these environment variables to your deployment:
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1">POLAR_ACCESS_TOKEN=your_api_token_here</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("POLAR_ACCESS_TOKEN=your_api_token_here")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1">POLAR_ORGANIZATION_ID=your_org_id_here</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("POLAR_ORGANIZATION_ID=your_org_id_here")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1">POLAR_WEBHOOK_SECRET=your_webhook_secret_here</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("POLAR_WEBHOOK_SECRET=your_webhook_secret_here")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Restart your application</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    After setting the environment variables, restart your Convex deployment to load the new configuration
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Test the connection</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the "Test Connection" button above to verify your setup
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {polarOrgInfo?.configured && testResult?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">🎉 Setup Complete!</CardTitle>
            <CardDescription>
              Your Polar.sh integration is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">Now you can:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Sync products from Polar.sh to your local database</li>
                <li>• Manage product information through the admin panel</li>
                <li>• Receive webhook notifications for subscription events</li>
              </ul>
              <div className="pt-3">
                <Button asChild>
                  <a href="/admin/products">
                    Go to Product Management
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}