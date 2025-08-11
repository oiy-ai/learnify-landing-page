import { Outlet } from "react-router";
import { useAuth, useUser } from "@clerk/react-router";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { AdminSidebar } from "~/components/admin/admin-sidebar";
import { AdminRouteWrapper } from "~/components/admin/AdminRouteWrapper";
import { SidebarProvider } from "~/components/ui/sidebar";
import { api } from "../../../convex/_generated/api";

export default function AdminLayout() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Mutation to sync user to Convex
  const upsertUser = useMutation(api.users.upsertUser);
  
  // Sync user data to Convex when user is available
  useEffect(() => {
    if (user && isSignedIn) {
      upsertUser().catch(console.error);
    }
  }, [user, isSignedIn, upsertUser]);

  return (
    <AdminRouteWrapper>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AdminSidebar />
          <main className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminRouteWrapper>
  );
}