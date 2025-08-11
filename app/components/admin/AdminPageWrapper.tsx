import { type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/react-router";
import { AccessDenied } from "~/components/AccessDenied";

interface AdminPageWrapperProps {
  children: ReactNode;
  requiredPermission: string;
  pageName?: string;
  description?: string;
}

export function AdminPageWrapper({ 
  children, 
  requiredPermission, 
  pageName,
  description 
}: AdminPageWrapperProps) {
  const { userId } = useAuth();

  // Check if user has the required permission
  const hasPermission = useQuery(
    api.permissions.checkAdminPermission,
    userId ? {
      userId: userId,
      permission: requiredPermission
    } : "skip"
  );

  // Get admin profile for additional context
  const adminProfile = useQuery(
    api.permissions.getAdminProfile,
    userId ? { userId: userId } : "skip"
  );

  // Loading state
  if (hasPermission === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (hasPermission === false) {
    return <AccessDenied fallbackRoute="/admin" />;
  }

  // User has permission, render the page
  return <>{children}</>;
}