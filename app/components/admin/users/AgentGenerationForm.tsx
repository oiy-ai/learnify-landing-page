import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { useUser } from "@clerk/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { 
  Bot, 
  Store, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Key,
  MessageSquare
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "~/hooks/use-toast";

interface AgentGenerationFormProps {
  userId: string | null;
  userDetail: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentGenerationForm({ 
  userId, 
  userDetail, 
  isOpen, 
  onClose 
}: AgentGenerationFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shopInfo, setShopInfo] = useState(userDetail?.shop_info || "");

  // Actions and Mutations
  const generateUserAgent = useAction(api.retell.generateUserAgent);
  const updateUserShopInfo = useAction(api.retell.updateUserShopInfo);
  const removeUserAgent = useMutation(api.retell.removeUserAgent);

  const handleGenerateAgent = async () => {
    if (!userId || !user?.id || !shopInfo.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the shop information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateUserAgent({
        adminId: user.id,
        userId,
        shopInfo: shopInfo.trim(),
      });

      toast({
        title: "Success",
        description: `Agent generated successfully! Agent ID: ${result.agentId}`,
      });

      onClose();
    } catch (error) {
      console.error("Failed to generate agent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateShopInfo = async () => {
    if (!userId || !user?.id || !shopInfo.trim()) {
      toast({
        title: "Error", 
        description: "Please fill in the shop information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserShopInfo({
        adminId: user.id,
        userId,
        shopInfo: shopInfo.trim(),
      });

      if (result.agentId) {
        toast({
          title: "Success",
          description: `Shop info updated and agent regenerated! New Agent ID: ${result.agentId}`,
        });
      } else {
        toast({
          title: "Success",
          description: "Shop info updated successfully",
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to update shop info:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update shop info",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAgent = async () => {
    if (!userId || !user?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove the Retell agent for this user? This will disable their voice AI features."
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await removeUserAgent({
        adminId: user.id,
        userId,
      });

      toast({
        title: "Success",
        description: "Agent removed successfully",
      });

      onClose();
    } catch (error) {
      console.error("Failed to remove agent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setShopInfo(userDetail?.shop_info || "");
  };

  if (!userDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Loading user details...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const hasApiKey = !!userDetail.retell_api_key;
  const hasAgent = !!userDetail.retell_agent_id;
  const canGenerateAgent = hasApiKey && shopInfo.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Retell AI Agent Management
          </DialogTitle>
          <DialogDescription>
            Generate and manage AI voice agents for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">API Key Status</span>
              </div>
              <Badge variant={hasApiKey ? "default" : "destructive"}>
                {hasApiKey ? "Configured" : "Missing"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Agent Status</span>
              </div>
              <Badge variant={hasAgent ? "default" : "outline"}>
                {hasAgent ? `Active (${userDetail.retell_agent_id})` : "Not Generated"}
              </Badge>
            </div>
          </div>

          {/* Prerequisites Alert */}
          {!hasApiKey && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This user must configure their Retell API key before an agent can be generated.
                Please ask them to add their API key in their settings first.
              </AlertDescription>
            </Alert>
          )}

          {/* Shop Information Form */}
          <div className="space-y-3">
            <Label htmlFor="shop-info" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Shop Information
            </Label>
            <Textarea
              id="shop-info"
              value={shopInfo}
              onChange={(e) => setShopInfo(e.target.value)}
              placeholder="Please enter shop information in English, such as: shop name, main products/services, business hours, contact information, special features, etc. Example: 'We are ABC Electronics Store, specializing in smartphones, laptops, and accessories. Open Monday-Friday 9AM-8PM, Saturday 10AM-6PM. We offer expert technical support and 1-year warranty on all products. Contact us at (555) 123-4567 for assistance.'"
              rows={8}
              disabled={!hasApiKey}
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ This information will be used as the AI assistant's global prompt for voice interactions. Please write in English for better AI performance.
            </p>
          </div>

          {/* Current Shop Info Display */}
          {userDetail.shop_info && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Current Shop Information:</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{userDetail.shop_info}</p>
            </div>
          )}

          {/* Success Alert for existing agent */}
          {hasAgent && hasApiKey && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This user already has a Retell AI agent configured. You can update the shop information 
                to regenerate the agent with new prompts, or remove the agent entirely.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          {hasAgent && (
            <Button
              variant="destructive"
              onClick={handleRemoveAgent}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove Agent
            </Button>
          )}
          
          {hasAgent ? (
            <Button
              onClick={handleUpdateShopInfo}
              disabled={isLoading || !canGenerateAgent}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update & Regenerate
            </Button>
          ) : (
            <Button
              onClick={handleGenerateAgent}
              disabled={isLoading || !canGenerateAgent}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Agent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}