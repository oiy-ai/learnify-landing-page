import { useAuth } from "@clerk/react-router";
import { useQuery } from "convex/react";
import { Navigate } from "react-router";
import { api } from "../../../convex/_generated/api";
import { AccessDenied } from "~/components/AccessDenied";

interface UserPermissionWrapperProps {
  permission: string;
  children: React.ReactNode;
  fallbackRoute?: string;
}

export function UserPermissionWrapper({ 
  permission, 
  children, 
  fallbackRoute = "/" 
}: UserPermissionWrapperProps) {
  const { userId, isLoaded } = useAuth();
  
  const hasPermission = useQuery(
    api.permissions.checkUserPermission,
    userId ? { userId, permission } : "skip"
  );

  // Show loading while checking
  if (!isLoaded || hasPermission === undefined) {
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

  // If user doesn't have permission, show access denied
  if (!hasPermission) {
    return <AccessDenied fallbackRoute={fallbackRoute} />;
  }

  return <>{children}</>;
}