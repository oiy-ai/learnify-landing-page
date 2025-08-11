import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Settings, Save, RotateCcw, AlertCircle } from "lucide-react";
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

interface GeneralSettingsProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: any) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  isLoading?: boolean;
}

export function GeneralSettings({ 
  settings, 
  onUpdateSetting, 
  onResetSetting, 
  isLoading = false 
}: GeneralSettingsProps) {
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
      console.log(`Settings saved: ${changedSettings.length} setting(s) updated successfully.`);
    } catch (error) {
      console.error("Error saving settings:", error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (key: string) => {
    try {
      await onResetSetting(key);
      // 重新获取设置值
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
        if (setting.key.includes("description")) {
          return (
            <Textarea
              value={value}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          );
        }
        
        if (setting.key === "system.timezone") {
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
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
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
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">General Settings</h2>
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
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Basic system configuration and display settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.startsWith("system.") && !s.key.includes("maintenance"))
              .map(setting => (
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

        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>
              Control system availability and maintenance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings
              .filter(s => s.key.includes("maintenance"))
              .map(setting => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-1">
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
      </div>
    </div>
  );
}