import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Bell, Save, RotateCcw, AlertCircle, Mail, AlertTriangle } from "lucide-react";
// import { useToast } from "~/hooks/use-toast";

interface Setting {
  _id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  type: "string" | "number" | "boolean" | "json" | "array";
  isPublic: boolean;
  updatedAt: number;
  updatedBy: string;
}

interface NotificationSettingsProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: any) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  isLoading?: boolean;
}

export function NotificationSettings({ 
  settings, 
  onUpdateSetting, 
  onResetSetting, 
  isLoading = false 
}: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    settings.forEach(setting => {
      initial[setting.key] = setting.value;
    });
    return initial;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  // const { toast } = useToast();

  const handleValueChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedSettings = settings.filter(setting => 
        localSettings[setting.key] !== setting.value
      );

      for (const setting of changedSettings) {
        await onUpdateSetting(setting.key, localSettings[setting.key]);
      }

      setHasChanges(false);
      console.log(`Notification settings saved: ${changedSettings.length} setting(s) updated successfully.`);
    } catch (error) {
      console.error("Error saving settings:", error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (key: string) => {
    try {
      await onResetSetting(key);
      const setting = settings.find(s => s.key === key);
      if (setting) {
        setLocalSettings(prev => ({
          ...prev,
          [key]: setting.value
        }));
      }
      console.log("Setting reset: Setting has been reset to default value.");
    } catch (error) {
      console.error("Error resetting setting:", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const value = localSettings[setting.key];

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={value}
              onCheckedChange={(checked) => handleValueChange(setting.key, checked)}
              disabled={isLoading}
            />
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {value ? "Enabled" : "Disabled"}
            </Label>
          </div>
        );

      case "string":
        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            disabled={isLoading}
            className="max-w-md"
            placeholder={setting.key.includes("email") ? "email@example.com" : ""}
          />
        );

      default:
        return (
          <Input
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(setting.key, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            disabled={isLoading}
            className="max-w-md font-mono text-sm"
          />
        );
    }
  };

  const getSettingDisplayName = (key: string) => {
    return key.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || key;
  };

  const getSettingIcon = (key: string) => {
    if (key.includes("email")) return <Mail className="h-4 w-4" />;
    if (key.includes("alert")) return <AlertTriangle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure email notification settings and sender information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("email"))
              .map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getSettingIcon(setting.key)}
                      <Label className="font-medium">
                        {getSettingDisplayName(setting.key)}
                      </Label>
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
                      onClick={() => handleReset(setting.key)}
                      disabled={isLoading}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Configure system alerts and administrative notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("alerts") && !s.key.includes("email"))
              .map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getSettingIcon(setting.key)}
                      <Label className="font-medium">
                        {getSettingDisplayName(setting.key)}
                      </Label>
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
                      onClick={() => handleReset(setting.key)}
                      disabled={isLoading}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Notification Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
            <CardDescription>
              Customize notification templates and messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">
                Email template customization will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>
              Send test notifications to verify configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Send Test Email</p>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify email configuration
                </p>
              </div>
              <Button variant="outline" disabled={isLoading}>
                <Mail className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}