"use client";
import { useQuery, useAction, useMutation } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export default function SubscriptionStatus() {
  const { isSignedIn, userId } = useAuth();
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Ensure user exists in database
  const upsertUser = useMutation(api.users.upsertUser);
  const [userEnsured, setUserEnsured] = useState(false);

  const subscription = useQuery(
    api.subscriptions.fetchUserSubscription,
    userEnsured ? {} : "skip"
  );
  const subscriptionStatus = useQuery(
    api.subscriptions.checkUserSubscriptionStatus,
    userEnsured ? {} : "skip"
  );
  const createPortalUrl = useAction(api.subscriptions.createCustomerPortalUrl);

  // Ensure user exists in database when component mounts
  useEffect(() => {
    if (isSignedIn && !userEnsured) {
      upsertUser()
        .then(() => {
          setUserEnsured(true);
        })
        .catch((error) => {
          console.error("Failed to ensure user in database:", error);
          // Still set to true to prevent infinite retry
          setUserEnsured(true);
        });
    }
  }, [isSignedIn, userEnsured, upsertUser]);

  const handleManageSubscription = async () => {
    if (!subscription?.customerId) return;

    setLoadingDashboard(true);
    try {
      const result = await createPortalUrl({
        customerId: subscription.customerId,
      });
      window.open(result.url, "_blank");
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            Please sign in to view your subscription details
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show loading while ensuring user exists in database
  if (!userEnsured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing user data...
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Handle the case where subscription is undefined (still loading) vs null (no subscription)
  if (subscription === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subscription details...
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>
            You don't have an active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200";
      case "past_due":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Subscription Status
              <Badge
                variant="outline"
                className={getStatusColor(subscription?.status || "unknown")}
              >
                {subscription?.status || "unknown"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Amount</p>
              <p className="text-sm text-muted-foreground">
                $
                {subscription?.amount
                  ? (subscription.amount / 100).toFixed(2)
                  : "0.00"}{" "}
                {subscription?.currency
                  ? subscription.currency.toUpperCase()
                  : "USD"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Next Billing</p>
              <p className="text-sm text-muted-foreground">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
        {subscription?.cancelAtPeriodEnd && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Your subscription will be canceled at the end of the current
              billing period.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={loadingDashboard || !subscription?.customerId}
            className="flex-1"
          >
            {loadingDashboard ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
