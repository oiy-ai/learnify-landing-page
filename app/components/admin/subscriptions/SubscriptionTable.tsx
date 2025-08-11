import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  Eye,
  Ban,
  DollarSign,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface SubscriptionTableProps {
  onViewSubscription: (subscriptionId: Id<"subscriptions">) => void;
  onEditSubscription: (subscriptionId: Id<"subscriptions">) => void;
}

export function SubscriptionTable({ onViewSubscription, onEditSubscription }: SubscriptionTableProps) {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [intervalFilter, setIntervalFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Queries
  const subscriptionsData = useQuery(
    api.subscriptions.getAllSubscriptions,
    user?.id ? {
      adminId: user.id,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      interval: intervalFilter === "all" ? undefined : intervalFilter,
      limit: pageSize,
      offset: currentPage * pageSize,
    } : "skip"
  );

  const subscriptionAnalytics = useQuery(
    api.subscriptions.getSubscriptionAnalytics,
    user?.id ? { adminId: user.id } : "skip"
  );

  // Mutations
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const handleCancelSubscription = async (subscriptionId: Id<"subscriptions">, userName: string) => {
    if (!user?.id) return;
    
    const reason = prompt(
      `Please provide a reason for canceling ${userName}'s subscription:`
    );
    
    if (!reason) return;

    try {
      await cancelSubscription({
        adminId: user.id,
        subscriptionId,
        reason,
      });
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "canceled": return "destructive";
      case "past_due": return "secondary";
      case "incomplete": return "outline";
      default: return "outline";
    }
  };

  const getIntervalColor = (interval: string) => {
    switch (interval) {
      case "month": return "default";
      case "year": return "secondary";
      default: return "outline";
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const subscriptions = subscriptionsData?.subscriptions || [];
  const total = subscriptionsData?.total || 0;
  const hasMore = subscriptionsData?.hasMore || false;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {subscriptionAnalytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold">{subscriptionAnalytics.active}</div>
            <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(subscriptionAnalytics.activeRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-orange-600">{subscriptionAnalytics.canceled}</div>
            <p className="text-xs text-muted-foreground">Canceled</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(subscriptionAnalytics.churnRate * 100) / 100}%
            </div>
            <p className="text-xs text-muted-foreground">Churn Rate</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={intervalFilter} onValueChange={setIntervalFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intervals</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Next Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {subscription.user?.name?.charAt(0)?.toUpperCase() || 
                         subscription.user?.email?.charAt(0)?.toUpperCase() || 
                         subscription.customerEmail?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {subscription.user?.name || subscription.customerEmail || "No name"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.user?.email || subscription.customerEmail}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(subscription.status || "unknown")} className="capitalize">
                    {subscription.status || "unknown"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">
                      {formatCurrency(subscription.amount || 0, subscription.currency || "USD")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getIntervalColor(subscription.interval || "month")} className="capitalize">
                    {subscription.interval || "month"}ly
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {subscription.startedAt 
                        ? formatDate(subscription.startedAt)
                        : "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {subscription.status === "active" && subscription.currentPeriodEnd ? (
                    <div className="flex items-center space-x-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>{formatDate(subscription.currentPeriodEnd)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewSubscription(subscription._id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditSubscription(subscription._id)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {subscription.status === "active" && (
                        <DropdownMenuItem 
                          onClick={() => handleCancelSubscription(
                            subscription._id, 
                            subscription.user?.name || subscription.user?.email || subscription.customerEmail || "Unknown"
                          )}
                          className="text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} subscriptions
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}