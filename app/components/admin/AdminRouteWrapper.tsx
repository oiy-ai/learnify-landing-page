import { useAuth } from "@clerk/react-router";
import { useQuery } from "convex/react";
import { Navigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { AccessDenied } from "~/components/AccessDenied";

interface AdminRouteWrapperProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

export function AdminRouteWrapper({ 
  children, 
  fallbackRoute = "/" 
}: AdminRouteWrapperProps) {
  const { userId, isLoaded } = useAuth();
  
  const isAdmin = useQuery(
    api.permissions.isAdmin,
    userId ? { userId } : "skip"
  );

  // Show loading while checking
  if (!isLoaded || isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user ID, redirect to sign in
  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  // If user is not an admin, show access denied
  if (!isAdmin) {
    return <AccessDenied fallbackRoute={fallbackRoute} />;
  }

  return <>{children}</>;
}