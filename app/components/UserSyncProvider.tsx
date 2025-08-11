import { useUserSync } from "~/hooks/useUserSync";

/**
 * Component that automatically syncs users when they log in
 * This should be placed high in the component tree
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  // This hook will automatically sync the user when they log in
  useUserSync();
  
  return <>{children}</>;
}