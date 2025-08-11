import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { AlertTriangle, Shield, Trash2, UserX } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  requireConfirmation?: boolean;
  confirmationText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  requireConfirmation = false,
  confirmationText = "CONFIRM",
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleConfirm = async () => {
    if (requireConfirmation && confirmationInput !== confirmationText) {
      return;
    }
    
    await onConfirm();
    setConfirmationInput("");
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmationValid = !requireConfirmation || confirmationInput === confirmationText;

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Shield className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type <code className="bg-muted px-1 py-0.5 rounded text-sm">{confirmationText}</code> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Type ${confirmationText} here...`}
              className={`${
                confirmationInput && confirmationInput !== confirmationText
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
            />
            {confirmationInput && confirmationInput !== confirmationText && (
              <p className="text-sm text-red-600">
                Confirmation text doesn't match
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmationValid || loading}
            variant={getButtonVariant()}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Predefined confirmation dialogs for common actions
export function DeleteUserConfirmation({
  open,
  onOpenChange,
  userName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete User Account"
      description={`Are you sure you want to delete the user account for "${userName}"? This action cannot be undone and will permanently remove all user data, subscriptions, and associated records.`}
      confirmText="Delete User"
      variant="destructive"
      requireConfirmation={true}
      confirmationText="DELETE"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

export function SuspendUserConfirmation({
  open,
  onOpenChange,
  userName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Suspend User Account"
      description={`Are you sure you want to suspend the user account for "${userName}"? The user will be unable to access their account until it is reactivated.`}
      confirmText="Suspend User"
      variant="warning"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

export function RevokeAdminConfirmation({
  open,
  onOpenChange,
  adminName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminName: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revoke Admin Privileges"
      description={`Are you sure you want to revoke admin privileges for "${adminName}"? They will lose access to all administrative functions immediately.`}
      confirmText="Revoke Access"
      variant="warning"
      requireConfirmation={true}
      confirmationText="REVOKE"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

export function SystemMaintenanceConfirmation({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Enable Maintenance Mode"
      description="Are you sure you want to enable maintenance mode? This will make the system unavailable to all users except super administrators. Only enable this during planned maintenance windows."
      confirmText="Enable Maintenance Mode"
      variant="warning"
      requireConfirmation={true}
      confirmationText="MAINTENANCE"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}