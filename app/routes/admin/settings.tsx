import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Settings, Users, Database, Bell, Lock, AlertCircle, FileText, HardDrive } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GeneralSettings } from "~/components/admin/settings/GeneralSettings";
import { UserSettings } from "~/components/admin/settings/UserSettings";
import { NotificationSettings } from "~/components/admin/settings/NotificationSettings";
import { SecuritySettings } from "~/components/admin/settings/SecuritySettings";
import { SystemLogs } from "~/components/admin/settings/SystemLogs";
import { BackupRestore } from "~/components/admin/settings/BackupRestore";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch all settings
  const allSettings = useQuery(api.settings.getAllSettings);

  // Mutations
  const updateSetting = useMutation(api.settings.updateSetting);
  const resetSetting = useMutation(api.settings.resetSetting);
  const initializeSettings = useMutation(api.settings.initializeDefaultSettings);

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      await updateSetting({ key, value });
    } catch (error) {
      throw error;
    }
  };

  const handleResetSetting = async (key: string) => {
    try {
      await resetSetting({ key });
    } catch (error) {
      throw error;
    }
  };

  const handleInitializeSettings = async () => {
    setIsInitializing(true);
    try {
      await initializeSettings();
    } catch (error) {
      console.error("Failed to initialize settings:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    if (!allSettings) return [];
    return allSettings.filter(setting => setting.category === category);
  };

  const isLoading = allSettings === undefined;
  const needsInitialization = allSettings !== undefined && allSettings.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system settings and manage administrators
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (needsInitialization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system settings and manage administrators
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Settings Initialization Required
            </CardTitle>
            <CardDescription>
              No system settings found. Click the button below to initialize default settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleInitializeSettings} 
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Settings...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Default Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and manage administrators
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings
            settings={getSettingsByCategory("general")}
            onUpdateSetting={handleUpdateSetting}
            onResetSetting={handleResetSetting}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserSettings
            settings={getSettingsByCategory("users")}
            onUpdateSetting={handleUpdateSetting}
            onResetSetting={handleResetSetting}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings
            settings={getSettingsByCategory("notifications")}
            onUpdateSetting={handleUpdateSetting}
            onResetSetting={handleResetSetting}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings
            settings={getSettingsByCategory("security")}
            onUpdateSetting={handleUpdateSetting}
            onResetSetting={handleResetSetting}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestore isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            {/* API Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure API settings and rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory("api").map((setting: any) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {setting.key.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={setting.value ? "default" : "secondary"}>
                        {setting.type === "boolean" 
                          ? (setting.value ? "Enabled" : "Disabled")
                          : String(setting.value)
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  System maintenance and backup tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">
                    System maintenance tools will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Current system status and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Status</p>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>
                  <Badge variant="default" className="bg-green-500">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-muted-foreground">Connected and operational</p>
                  </div>
                  <Badge variant="default" className="bg-green-500">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Settings Count</p>
                    <p className="text-sm text-muted-foreground">Total configured settings</p>
                  </div>
                  <Badge variant="outline">{allSettings?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}