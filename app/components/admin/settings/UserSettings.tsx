import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Users, Save, RotateCcw, AlertCircle } from "lucide-react";
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

interface UserSettingsProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: any) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  isLoading?: boolean;
}

export function UserSettings({ 
  settings, 
  onUpdateSetting, 
  onResetSetting, 
  isLoading = false 
}: UserSettingsProps) {
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
      console.log(`User settings saved: ${changedSettings.length} setting(s) updated successfully.`);
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

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value) || 0)}
            disabled={isLoading}
            className="max-w-xs"
          />
        );

      case "string":
        if (setting.key === "users.default_role") {
          return (
            <Select
              value={value}
              onValueChange={(newValue) => handleValueChange(setting.key, newValue)}
              disabled={isLoading}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          );
        }

        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            disabled={isLoading}
            className="max-w-md"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">User Settings</h2>
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
        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Registration & Approval</CardTitle>
            <CardDescription>
              Control how new users register and get approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("auto_approval") || s.key.includes("email_verification") || s.key.includes("default_role"))
              .map(setting => (
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

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Configure user session behavior and timeouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings
              .filter(s => s.key.includes("session_timeout"))
              .map(setting => (
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
                    <span className="text-sm text-muted-foreground">hours</span>
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

        {/* User Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Default Permissions</CardTitle>
            <CardDescription>
              Set default permissions and roles for new users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">
                Advanced permission settings will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}