import { useAuth, useUser } from "@clerk/react-router";
import { useMutation } from "convex/react";
import { Navigate, Outlet } from "react-router";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { SiteHeader } from "~/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { UserPermissionWrapper } from "~/components/user/UserPermissionWrapper";
import { PERMISSIONS } from "~/lib/permissions";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
// import type { Route } from "./+types/layout"; // Not needed for SPA
// import { createClerkClient } from "@clerk/react-router/api.server"; // Not needed for SPA

export default function DashboardLayout() {
  const { isSignedIn, userId, isLoaded } = useAuth();
  const { user } = useUser();
  
  // Mutation to sync user to Convex
  const upsertUser = useMutation(api.users.upsertUser);
  
  // Sync user data to Convex when user is available
  useEffect(() => {
    if (user && isSignedIn) {
      upsertUser().catch(console.error);
    }
  }, [user, isSignedIn, upsertUser]);
  
  // Wait for Clerk to load before checking authentication
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // Client-side authentication check
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <UserPermissionWrapper permission={PERMISSIONS.ACCESS_DASHBOARD}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </UserPermissionWrapper>
  );
}
