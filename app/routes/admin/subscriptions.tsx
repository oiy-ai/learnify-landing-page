import { useState } from "react";
import { CreditCard, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SubscriptionTable } from "~/components/admin/subscriptions/SubscriptionTable";
import { SubscriptionDetail } from "~/components/admin/subscriptions/SubscriptionDetail";
import { RevenueChart } from "~/components/admin/subscriptions/RevenueChart";
import { PolarSyncManager } from "~/components/admin/polar/PolarSyncManager";
import { AdminPageWrapper } from "~/components/admin/AdminPageWrapper";
import { PERMISSIONS } from "~/lib/permissions";
import type { Id } from "../../../convex/_generated/dataModel";

export default function AdminSubscriptions() {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<Id<"subscriptions"> | null>(null);
  const [showSubscriptionDetail, setShowSubscriptionDetail] = useState(false);

  const handleViewSubscription = (subscriptionId: Id<"subscriptions">) => {
    setSelectedSubscriptionId(subscriptionId);
    setShowSubscriptionDetail(true);
  };

  const handleEditSubscription = (subscriptionId: Id<"subscriptions">) => {
    // TODO: Implement subscription editing functionality
    console.log("Edit subscription:", subscriptionId);
  };

  const handleCloseSubscriptionDetail = () => {
    setShowSubscriptionDetail(false);
    setSelectedSubscriptionId(null);
  };

  return (
    <AdminPageWrapper
      requiredPermission={PERMISSIONS.PAGE_ADMIN_SUBSCRIPTIONS}
      pageName="Subscription Management"
      description="This page allows you to monitor subscriptions, payments, and billing analytics."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
            <p className="text-muted-foreground">
              Monitor subscriptions, payments, and billing analytics
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="polar-sync" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Polar Sync
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionTable 
              onViewSubscription={handleViewSubscription}
              onEditSubscription={handleEditSubscription}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <RevenueChart />
          </TabsContent>
          
          <TabsContent value="polar-sync" className="space-y-6">
            <PolarSyncManager />
          </TabsContent>
        </Tabs>

        {/* Subscription Detail Modal */}
        <SubscriptionDetail
          subscriptionId={selectedSubscriptionId}
          isOpen={showSubscriptionDetail}
          onClose={handleCloseSubscriptionDetail}
        />
      </div>
    </AdminPageWrapper>
  );
}