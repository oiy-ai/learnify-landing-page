import React from 'react';
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showErrorDetails?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (you could send this to your error reporting service)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isConvexError = this.state.error?.message?.includes('CONVEX') || 
                           this.state.error?.message?.includes('Access denied');
      const isPermissionError = this.state.error?.message?.includes('Access denied') ||
                               this.state.error?.message?.includes('Admin privileges required');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {isPermissionError ? "Access Denied" : "Something went wrong"}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {isPermissionError 
                  ? "You don't have permission to access this resource."
                  : "We're sorry, but something unexpected happened. Please try again."
                }
              </p>
              
              <Alert className="border-red-200 bg-red-50 mb-6 text-left">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {isPermissionError ? (
                    <>
                      <strong>Access Restricted</strong><br />
                      This area requires special permissions. Please contact your administrator if you believe you should have access.
                    </>
                  ) : (
                    <>
                      <strong>Error Occurred</strong><br />
                      {this.props.showErrorDetails && this.state.error?.message 
                        ? `Technical details: ${this.state.error.message}`
                        : "An unexpected error occurred. Our team has been notified."
                      }
                    </>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  ← Go Back
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for easier use
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}