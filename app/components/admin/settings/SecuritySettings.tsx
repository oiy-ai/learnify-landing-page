import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Shield, Save, RotateCcw, AlertCircle, Lock, Key, Clock } from "lucide-react";
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

interface SecuritySettingsProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: any) => Promise<void>;
  onResetSetting: (key: string) => Promise<void>;
  isLoading?: boolean;
}

export function SecuritySettings({ 
  settings, 
  onUpdateSetting, 
  onResetSetting, 
  isLoading = false 
}: SecuritySettingsProps) {
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
      console.log(`Security settings saved: ${changedSettings.length} setting(s) updated successfully.`);
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
            min={1}
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
    if (key.includes("password")) return <Key className="h-4 w-4" />;
    if (key.includes("lockout") || key.includes("attempts")) return <Lock className="h-4 w-4" />;
    if (key.includes("2fa")) return <Shield className="h-4 w-4" />;
    if (key.includes("duration")) return <Clock className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getUnitLabel = (key: string) => {
    if (key.includes("duration")) return "minutes";
    if (key.includes("length")) return "characters";
    if (key.includes("attempts")) return "attempts";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Security Settings</h2>
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
        {/* Authentication Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Security
            </CardTitle>
            <CardDescription>
              Configure login security and account protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("login") || s.key.includes("lockout"))
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
                    {getUnitLabel(setting.key) && (
                      <span className="text-sm text-muted-foreground">
                        {getUnitLabel(setting.key)}
                      </span>
                    )}
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

        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Policy
            </CardTitle>
            <CardDescription>
              Set password requirements and security standards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("password"))
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
                    {getUnitLabel(setting.key) && (
                      <span className="text-sm text-muted-foreground">
                        {getUnitLabel(setting.key)}
                      </span>
                    )}
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

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Configure two-factor authentication requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter(s => s.key.includes("2fa"))
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
            
            {/* Additional 2FA Options */}
            <div className="pt-4 border-t">
              <div className="text-center py-4 text-muted-foreground">
                <Shield className="mx-auto h-6 w-6 mb-2" />
                <p className="text-sm">
                  Advanced 2FA configuration options will be available in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Security Monitoring</CardTitle>
            <CardDescription>
              Monitor security events and suspicious activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">
                Security monitoring and alerting features will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}