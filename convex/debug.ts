import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug function to check environment variables
 * This should only be used for debugging and removed in production
 */
export const checkEnvironmentVariables = query({
  args: {},
  handler: async (ctx, args) => {
    return {
      hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
      hasOrgId: !!process.env.POLAR_ORGANIZATION_ID,
      hasWebhookSecret: !!process.env.POLAR_WEBHOOK_SECRET,
      accessTokenLength: process.env.POLAR_ACCESS_TOKEN?.length || 0,
      orgIdLength: process.env.POLAR_ORGANIZATION_ID?.length || 0,
      webhookSecretLength: process.env.POLAR_WEBHOOK_SECRET?.length || 0,
      // Don't expose actual values for security
      accessTokenPrefix: process.env.POLAR_ACCESS_TOKEN?.substring(0, 10) + "...",
      orgIdPrefix: process.env.POLAR_ORGANIZATION_ID?.substring(0, 10) + "...",
    };
  },
});