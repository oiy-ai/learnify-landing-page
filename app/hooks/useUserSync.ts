import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { api } from "../../convex/_generated/api";

/**
 * Hook to automatically sync the current user with Convex database
 * This ensures that users logged in via Google or other providers
 * are automatically created in the database
 */
export function useUserSync() {
  const { userId, isLoaded } = useAuth();
  
  // Check if user needs to be synced
  const needsSync = useQuery(
    api.userSync.needsUserSync,
    userId ? {} : "skip"
  );
  
  // Get current user info
  const currentUser = useQuery(
    api.userSync.getCurrentUser,
    userId ? {} : "skip"
  );
  
  // Mutation to sync user
  const syncUser = useMutation(api.userSync.syncCurrentUser);
  
  // Auto-sync user when they log in
  useEffect(() => {
    if (isLoaded && userId && needsSync) {
      syncUser().catch(console.error);
    }
  }, [isLoaded, userId, needsSync, syncUser]);
  
  return {
    user: currentUser,
    isLoading: !isLoaded || (userId && needsSync === undefined),
    needsSync,
  };
}