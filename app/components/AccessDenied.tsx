import { Shield, AlertCircle, Home } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface AccessDeniedProps {
  fallbackRoute?: string;
}

export function AccessDenied({ 
  fallbackRoute = "/" 
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/15 mb-6">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
          </p>
          
          <Alert variant="destructive" className="mb-6 text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Access Restricted</strong></p>
                <p className="text-sm">
                  Please contact an administrator if you believe this is an error.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Full-width buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              ← Go Back
            </Button>
            <Button
              onClick={() => window.location.href = fallbackRoute}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}