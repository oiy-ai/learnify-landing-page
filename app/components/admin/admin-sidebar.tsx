import { Link, useLocation } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "~/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  Shield,
  Activity,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { PERMISSIONS } from "~/lib/permissions";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    permission: PERMISSIONS.PAGE_ADMIN_DASHBOARD,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    permission: PERMISSIONS.PAGE_ADMIN_USERS,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
    permission: PERMISSIONS.PAGE_ADMIN_SUBSCRIPTIONS,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
    permission: PERMISSIONS.PAGE_ADMIN_PRODUCTS,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    permission: PERMISSIONS.PAGE_ADMIN_ANALYTICS,
  },
  {
    title: "Permissions",
    url: "/admin/permissions",
    icon: ShieldCheck,
    permission: PERMISSIONS.PAGE_ADMIN_PERMISSIONS,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    permission: PERMISSIONS.PAGE_ADMIN_SETTINGS,
  },
  {
    title: "Security",
    url: "/admin/security",
    icon: Shield,
    permission: PERMISSIONS.PAGE_ADMIN_SECURITY,
  },
  {
    title: "Performance",
    url: "/admin/performance",
    icon: Activity,
    permission: PERMISSIONS.PAGE_ADMIN_PERFORMANCE,
  },
  {
    title: "Polar.sh Setup",
    url: "/admin/polar-setup",
    icon: Package,
    permission: PERMISSIONS.PAGE_ADMIN_POLAR_SETUP,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user } = useUser();
  
  // Get admin permissions
  const adminAccess = useQuery(
    api.admin.canAccessAdminPanel,
    user?.id ? { userId: user.id } : "skip"
  );

  // Check individual permissions
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!adminAccess?.permissions) return false;
    
    // Super admin has all permissions
    if (adminAccess.role === "super_admin") return true;
    
    return (adminAccess.permissions as unknown as string[]).includes(permission);
  };

  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter(item => hasPermission(item.permission));

  // Debug logging (remove in production)
  console.log("Admin Sidebar Debug:", {
    user: !!user,
    adminAccess,
    visibleNavItems: visibleNavItems.length,
    navItemsTotal: navItems.length
  });

  if (!user || !adminAccess?.canAccess) {
    return (
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="text-center text-muted-foreground">
          <Shield className="mx-auto h-12 w-12 mb-4" />
          <p>Access Denied</p>
          <p className="text-sm">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

  return (
    <Sidebar collapsible="offcanvas" className="w-64">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Admin Panel</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {adminAccess.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
            <AvatarFallback>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.fullName || user.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-xs text-muted-foreground">
              Administrator
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              User Dashboard
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              // Handle logout - this would typically use Clerk's signOut
              window.location.href = "/sign-in";
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>

      {/* Clickable rail to toggle collapse/expand on desktop */}
      <SidebarRail />
    </Sidebar>
  );
}