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
import { 
  CreditCard, 
  User, 
  DollarSign, 
  Calendar, 
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface SubscriptionDetailProps {
  subscriptionId: Id<"subscriptions"> | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionDetail({ subscriptionId, isOpen, onClose }: SubscriptionDetailProps) {
  const { user: currentUser } = useUser();

  const subscriptionDetail = useQuery(
    api.subscriptions.getSubscriptionDetail,
    subscriptionId && currentUser?.id ? {
      adminId: currentUser.id,
      subscriptionId,
    } : "skip"
  );

  if (!subscriptionDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Subscription Details...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "canceled": return "destructive";
      case "past_due": return "secondary";
      case "incomplete": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "canceled": return <XCircle className="h-4 w-4" />;
      case "past_due": return <AlertCircle className="h-4 w-4" />;
      case "incomplete": return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getWebhookEventColor = (eventType: string) => {
    if (eventType.includes("created")) return "default";
    if (eventType.includes("active")) return "default";
    if (eventType.includes("canceled")) return "destructive";
    if (eventType.includes("updated")) return "secondary";
    return "outline";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Subscription Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about this subscription
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Status and Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(subscriptionDetail.status || "unknown")}
                  <span>Subscription Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(subscriptionDetail.status || "unknown")} className="capitalize">
                        {subscriptionDetail.status || "unknown"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                    <p className="font-mono text-sm">{subscriptionDetail.polarId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="font-semibold text-lg">
                      {formatCurrency(subscriptionDetail.amount || 0, subscriptionDetail.currency || "USD")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Billing Interval</label>
                    <p className="font-medium capitalize">{subscriptionDetail.interval || "month"}ly</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started</label>
                    <p className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {subscriptionDetail.startedAt 
                          ? formatDate(subscriptionDetail.startedAt)
                          : "Unknown"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cancel at Period End</label>
                    <p className="flex items-center space-x-1">
                      {subscriptionDetail.cancelAtPeriodEnd ? (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>Yes</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>No</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Info */}
            {subscriptionDetail.status === "canceled" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4" />
                    <span>Cancellation Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Canceled At</label>
                      <p>
                        {subscriptionDetail.canceledAt 
                          ? formatDate(subscriptionDetail.canceledAt)
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reason</label>
                      <p className="capitalize">
                        {subscriptionDetail.customerCancellationReason || "No reason provided"}
                      </p>
                    </div>
                  </div>
                  {subscriptionDetail.customerCancellationComment && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Comment</label>
                      <p className="text-sm">{subscriptionDetail.customerCancellationComment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Billing Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Period Start</label>
                    <p className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {subscriptionDetail.currentPeriodStart 
                          ? formatDate(subscriptionDetail.currentPeriodStart)
                          : "Unknown"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Period End</label>
                    <p className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {subscriptionDetail.currentPeriodEnd 
                          ? formatDate(subscriptionDetail.currentPeriodEnd)
                          : "Unknown"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price ID</label>
                    <p className="font-mono text-sm">{subscriptionDetail.polarPriceId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                    <p className="font-mono text-sm">{subscriptionDetail.customerId}</p>
                  </div>
                </div>

                {/* Next Billing */}
                {subscriptionDetail.status === "active" && subscriptionDetail.currentPeriodEnd && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">Next Billing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The next billing cycle will occur on{" "}
                      <span className="font-medium">
                        {formatDate(subscriptionDetail.currentPeriodEnd)}
                      </span>{" "}
                      for{" "}
                      <span className="font-medium">
                        {formatCurrency(subscriptionDetail.amount || 0, subscriptionDetail.currency || "USD")}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionDetail.user ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="font-medium">{subscriptionDetail.user.name || "No name provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="font-medium">{subscriptionDetail.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="font-mono text-sm">{subscriptionDetail.user.tokenIdentifier}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p>
                        {subscriptionDetail.user.createdAt 
                          ? formatDate(subscriptionDetail.user.createdAt)
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Customer information not available</p>
                )}

                {/* Metadata */}
                {subscriptionDetail.metadata && Object.keys(subscriptionDetail.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Metadata</label>
                    <div className="space-y-2">
                      {Object.entries(subscriptionDetail.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Webhook Events</span>
                </CardTitle>
                <CardDescription>
                  Recent webhook events for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionDetail.webhookEvents && subscriptionDetail.webhookEvents.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptionDetail.webhookEvents.map((event) => (
                      <div key={event._id} className="border-l-2 border-primary pl-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant={getWebhookEventColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(new Date(event.createdAt).getTime())}
                          </span>
                        </div>
                        {event.data && (
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View event data
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No webhook events found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}