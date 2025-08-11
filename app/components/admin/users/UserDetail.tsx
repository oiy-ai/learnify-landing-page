import { useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { CodeBlock, CodeBlockCode } from "~/components/ui/code-block";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity, 
  CreditCard,
  Clock,
  Globe,
  Smartphone,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";

interface UserDetailProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetail({ userId, isOpen, onClose }: UserDetailProps) {
  const { user: currentUser } = useUser();

  const userDetail = useQuery(
    api.users.getUserDetail,
    userId && currentUser?.id ? {
      adminId: currentUser.id,
      userId,
    } : "skip"
  );

  const userActivity = useQuery(
    api.users.getUserActivity,
    userId && currentUser?.id ? {
      adminId: currentUser.id,
      userId,
      limit: 10,
    } : "skip"
  );

  if (!userDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading User Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getRoleColor = (role?: string, adminRole?: string) => {
    if (adminRole === "super_admin") return "destructive";
    if (adminRole === "admin") return "default";
    if (adminRole === "support") return "secondary";
    if (role === "admin" || role === "super_admin") return "default";
    return "outline";
  };

  const getRoleLabel = (role?: string, adminRole?: string) => {
    if (adminRole) return adminRole.replace("_", " ");
    return role || "user";
  };

  const getStatusColor = (isActive?: boolean) => {
    if (isActive === false) return "destructive";
    return "default";
  };

  const getSubscriptionStatusColor = (status?: string) => {
    switch (status) {
      case "active": return "default";
      case "canceled": return "destructive";
      case "past_due": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about this user account
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{userDetail.name || "No name provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{userDetail.email || "No email provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="font-mono text-sm">{userDetail.tokenIdentifier}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div>
                      <Badge variant={getRoleColor(userDetail.role, userDetail.adminRecord?.role)} className="capitalize">
                        {getRoleLabel(userDetail.role, userDetail.adminRecord?.role)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div>
                      <Badge variant={getStatusColor(userDetail.isActive)}>
                        {userDetail.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {userDetail.createdAt 
                          ? new Date(userDetail.createdAt).toLocaleDateString()
                          : "Unknown"
                        }
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Information */}
            {userDetail.adminRecord && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Admin Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Admin Role</label>
                      <p className="font-medium capitalize">{userDetail.adminRecord.role.replace("_", " ")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Permissions Count</label>
                      <p className="font-medium">{userDetail.adminRecord.permissions.length}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Admin Since</label>
                      <p className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(userDetail.adminRecord.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created By</label>
                      <p className="font-medium">{userDetail.adminRecord.createdBy || "System"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Permissions</label>
                    <div className="flex flex-wrap gap-1">
                      {userDetail.adminRecord.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {userDetail.user_agent_json && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>User Agent JSON</span>
                  </CardTitle>
                  <CardDescription>
                    该用户产生的 JSON 数据，仅供查看
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock>
                    <CodeBlockCode
                      code={JSON.stringify(userDetail.user_agent_json, null, 2)}
                      language="json"
                      theme="github-dark"
                    />
                  </CodeBlock>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Subscriptions</span>
                </CardTitle>
                <CardDescription>
                  All subscriptions associated with this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetail.subscriptions && userDetail.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {userDetail.subscriptions.map((subscription) => (
                      <div key={subscription._id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getSubscriptionStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {subscription.currency} {subscription.amount}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Interval:</span> {subscription.interval}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Started:</span>{" "}
                            {subscription.startedAt 
                              ? new Date(subscription.startedAt).toLocaleDateString()
                              : "N/A"
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subscriptions found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Active Sessions</span>
                </CardTitle>
                <CardDescription>
                  Current and recent login sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetail.sessions && userDetail.sessions.length > 0 ? (
                  <div className="space-y-3">
                    {userDetail.sessions.map((session) => (
                      <div key={session._id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={session.isActive ? "default" : "secondary"}>
                            {session.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(session.loginAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {session.ipAddress && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>{session.ipAddress}</span>
                            </div>
                          )}
                          {session.deviceInfo && (
                            <div className="flex items-center space-x-1">
                              <Smartphone className="h-3 w-3" />
                              <span>{session.deviceInfo}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Last active: {new Date(session.lastActiveAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No sessions found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Recent admin actions and user activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userActivity?.auditLogs && userActivity.auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.auditLogs.map((log) => (
                      <div key={log._id} className="border-l-2 border-primary pl-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {JSON.stringify(log.details, null, 2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}