import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Settings, Users, Database, Bell, Lock, Save, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

// Mock data for testing
const mockSettings = [
  {
    _id: "1",
    key: "system.name",
    value: "Admin Dashboard",
    category: "general",
    description: "System name displayed in the interface",
    type: "string" as const,
    isPublic: true,
    updatedAt: Date.now(),
    updatedBy: "test-user"
  },
  {
    _id: "2", 
    key: "system.maintenance_mode",
    value: false,
    category: "general",
    description: "Enable maintenance mode",
    type: "boolean" as const,
    isPublic: false,
    updatedAt: Date.now(),
    updatedBy: "test-user"
  },
  {
    _id: "3",
    key: "users.auto_approval", 
    value: true,
    category: "users",
    description: "Automatically approve new user registrations",
    type: "boolean" as const,
    isPublic: false,
    updatedAt: Date.now(),
    updatedBy: "test-user"
  },
  {
    _id: "4",
    key: "notifications.email_enabled",
    value: true,
    category: "notifications", 
    description: "Enable email notifications",
    type: "boolean" as const,
    isPublic: false,
    updatedAt: Date.now(),
    updatedBy: "test-user"
  },
  {
    _id: "5",
    key: "security.max_login_attempts",
    value: 5,
    category: "security",
    description: "Maximum login attempts before lockout", 
    type: "number" as const,
    isPublic: false,
    updatedAt: Date.now(),
    updatedBy: "test-user"
  }
];

type SettingType = typeof mockSettings[number];

export default function AdminSettingsSimple() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SettingType[]>(mockSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const handleUpdateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
    setHasChanges(true);
    console.log(`Updated setting ${key} to:`, value);
  };

  const handleSaveChanges = () => {
    setHasChanges(false);
    console.log("Settings saved successfully!");
  };

  const handleResetSetting = (key: string) => {
    const originalSetting = mockSettings.find(s => s.key === key);
    if (originalSetting) {
      setSettings(prev => prev.map(setting => 
        setting.key === key ? originalSetting : setting
      ));
      console.log(`Reset setting ${key} to default value`);
    }
  };

  const renderSettingInput = (setting: any) => {
    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={setting.value}
              onCheckedChange={(checked) => handleUpdateSetting(setting.key, checked)}
            />
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.value ? "Enabled" : "Disabled"}
            </Label>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleUpdateSetting(setting.key, parseInt(e.target.value) || 0)}
            className="max-w-xs"
          />
        );

      case "string":
        return (
          <Input
            value={setting.value}
            onChange={(e) => handleUpdateSetting(setting.key, e.target.value)}
            className="max-w-md"
          />
        );

      default:
        return (
          <Input
            value={JSON.stringify(setting.value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleUpdateSetting(setting.key, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className="max-w-md font-mono text-sm"
          />
        );
    }
  };

  const getSettingDisplayName = (key: string) => {
    return key.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings (Demo)</h1>
          <p className="text-muted-foreground">
            Demo version with mock data - Configure system settings and manage administrators
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic system configuration and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("general").map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">
                        {getSettingDisplayName(setting.key)}
                      </Label>
                      {setting.isPublic && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSettingInput(setting)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetSetting(setting.key)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Settings
              </CardTitle>
              <CardDescription>
                User management and registration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("users").map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label className="font-medium">
                      {getSettingDisplayName(setting.key)}
                    </Label>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSettingInput(setting)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetSetting(setting.key)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Email and system notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("notifications").map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label className="font-medium">
                      {getSettingDisplayName(setting.key)}
                    </Label>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSettingInput(setting)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetSetting(setting.key)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("security").map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label className="font-medium">
                      {getSettingDisplayName(setting.key)}
                    </Label>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSettingInput(setting)}
                    <span className="text-sm text-muted-foreground">
                      {setting.key.includes("attempts") ? "attempts" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetSetting(setting.key)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                System maintenance and advanced settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">
                  This is a demo version. Advanced settings would include API configuration, 
                  system maintenance tools, and backup management.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <Settings className="h-5 w-5" />
            <div>
              <p className="font-medium">Demo Mode</p>
              <p className="text-sm">
                This is a demo version with mock data. Changes are only stored locally and will reset on page refresh.
                The full version with Convex integration is available at <code>/admin/settings</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}