"use client";
import SubscriptionStatus from "~/components/subscription-status";
import { RetellApiKeySettings } from "~/components/dashboard/RetellApiKeySettings";
import { UserPermissionWrapper } from "~/components/user/UserPermissionWrapper";
import { PERMISSIONS } from "~/lib/permissions";

export default function Page() {
  return (
    <UserPermissionWrapper permission={PERMISSIONS.ACCESS_USER_SETTINGS}>
      <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            
            <SubscriptionStatus />
            
            <RetellApiKeySettings />
          </div>
        </div>
      </div>
      </div>
    </UserPermissionWrapper>
  );
}
