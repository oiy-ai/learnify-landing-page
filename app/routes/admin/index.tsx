import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { AdminPageWrapper } from "~/components/admin/AdminPageWrapper";
import { PERMISSIONS } from "~/lib/permissions";
import {
  Users,
  CreditCard,
  Package,
  Activity,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Shield,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function AdminDashboard() {
  const { user } = useUser();

  // Get admin dashboard statistics
  const dashboardStats = useQuery(
    api.admin.getAdminDashboardStats,
    user?.id ? { adminId: user.id } : "skip"
  );

  // Get admin profile (inside AdminPageWrapper context)
  const adminProfile = useQuery(
    api.admin.getAdminProfile,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get recent admin activities
  const recentActivities = useQuery(
    api.admin.getRecentAdminActivities,
    user?.id ? { adminId: user.id, limit: 10 } : "skip"
  );

  const stats: StatCard[] = [
    {
      title: "Total Users",
      value: dashboardStats?.users.total || 0,
      description: `${dashboardStats?.users.newToday || 0} new today`,
      icon: Users,
      trend: {
        value: "+12%",
        isPositive: true,
      },
    },
    {
      title: "Active Subscriptions",
      value: dashboardStats?.subscriptions.active || 0,
      description: `of ${dashboardStats?.subscriptions.total || 0} total`,
      icon: CreditCard,
      trend: {
        value: "+8%",
        isPositive: true,
      },
    },
    {
      title: "Active Users",
      value: dashboardStats?.users.active || 0,
      description: "Users with active accounts",
      icon: Activity,
      trend: {
        value: "+5%",
        isPositive: true,
      },
    },
    {
      title: "Recent Activities",
      value: dashboardStats?.recentActivities || 0,
      description: "Admin actions today",
      icon: TrendingUp,
    },
  ];

  return (
    <AdminPageWrapper
      requiredPermission={PERMISSIONS.PAGE_ADMIN_DASHBOARD}
      pageName="Admin Dashboard"
      description="This is the main admin dashboard with overview of system statistics and quick actions."
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Admin'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {adminProfile?.role?.replace('_', ' ') || 'Admin'}
          </Badge>
          <Badge variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                {stat.trend && (
                  <Badge
                    variant={stat.trend.isPositive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stat.trend.value}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/admin/users">View All Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Monitor subscriptions, payments, and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/admin/subscriptions">View Subscriptions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Management
            </CardTitle>
            <CardDescription>
              Configure products, pricing, and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/admin/products">Manage Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>
            Latest administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">
                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.admin ? `${activity.admin.name || activity.admin.email}` : 'System'} 
                        {activity.targetUser && ` → ${activity.targetUser.name || activity.targetUser.email}`}
                        {activity.details && typeof activity.details === 'object' && 'reason' in activity.details && ` (${activity.details.reason})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    <Badge 
                      variant={activity.action.includes('error') ? 'destructive' : 'secondary'}
                      className="mt-1"
                    >
                      {activity.target}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-4" />
              <p>No recent activities to display</p>
              <p className="text-sm">Admin actions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminPageWrapper>
  );
}