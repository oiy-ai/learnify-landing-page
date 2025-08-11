import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Eye, EyeOff, Key, Trash2, Save } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "~/hooks/use-toast";

export function RetellApiKeySettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const retellKeyData = useQuery(api.users.getRetellApiKey);

  // Mutations
  const updateRetellApiKey = useMutation(api.users.updateRetellApiKey);
  const removeRetellApiKey = useMutation(api.users.removeRetellApiKey);

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateRetellApiKey({ retell_api_key: newApiKey.trim() });
      toast({
        title: "Success",
        description: "Retell API key updated successfully",
      });
      setIsEditing(false);
      setNewApiKey("");
    } catch (error) {
      console.error("Failed to update API key:", error);
      toast({
        title: "Error",
        description: "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove your Retell API key? This will disable voice features."
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await removeRetellApiKey();
      toast({
        title: "Success",
        description: "Retell API key removed successfully",
      });
    } catch (error) {
      console.error("Failed to remove API key:", error);
      toast({
        title: "Error",
        description: "Failed to remove API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewApiKey("");
  };

  const maskedKey = retellKeyData?.retell_api_key 
    ? `${retellKeyData.retell_api_key.slice(0, 8)}${"*".repeat(retellKeyData.retell_api_key.length - 12)}${retellKeyData.retell_api_key.slice(-4)}`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Retell AI Integration
        </CardTitle>
        <CardDescription>
          Configure your Retell API key for voice AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="font-medium">API Key Status</div>
            <div className="text-sm text-muted-foreground">
              {retellKeyData?.hasKey ? "Configured and ready" : "Not configured"}
            </div>
          </div>
          <Badge variant={retellKeyData?.hasKey ? "default" : "outline"}>
            {retellKeyData?.hasKey ? "Active" : "Not Set"}
          </Badge>
        </div>

        {/* Current Key Display */}
        {retellKeyData?.hasKey && !isEditing && (
          <div className="space-y-2">
            <Label>Current API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={showKey ? (retellKeyData.retell_api_key || "") : maskedKey}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-api-key">New API Key</Label>
              <Input
                id="new-api-key"
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your Retell API key"
                className="font-mono"
              />
            </div>
            
            <Alert>
              <AlertDescription>
                Your API key will be encrypted and stored securely. It will only be used for 
                voice AI features within this application.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleSaveApiKey} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Key"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(true)}>
              {retellKeyData?.hasKey ? "Update API Key" : "Add API Key"}
            </Button>
            {retellKeyData?.hasKey && (
              <Button
                variant="destructive"
                onClick={handleRemoveApiKey}
                disabled={isLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Key
              </Button>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">How to get your Retell API key:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Visit the Retell AI dashboard</li>
                <li>Navigate to API Keys section</li>
                <li>Create a new API key or copy an existing one</li>
                <li>Paste it in the field above</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}