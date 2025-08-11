import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

/**
 * Find user by email helper function
 */
export const findUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.email))
      .first();
    
    return { user };
  },
});

/**
 * Fix subscription by manually associating it with the correct user
 */
export const fixSubscriptionAssociation = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by email
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!user) {
      throw new ConvexError(`User with email ${args.userEmail} not found`);
    }

    // Get the subscription
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new ConvexError("Subscription not found");
    }

    // Update the subscription to associate it with the correct user
    await ctx.db.patch(args.subscriptionId, {
      userId: user.tokenIdentifier,
    });

    console.log(`Fixed subscription ${args.subscriptionId} for user ${user.email} (${user.tokenIdentifier})`);

    return {
      success: true,
      message: `Successfully associated subscription with ${user.email}`,
      subscription: {
        id: args.subscriptionId,
        userId: user.tokenIdentifier,
        userEmail: user.email,
        status: subscription.status,
        amount: subscription.amount,
        interval: subscription.interval,
      }
    };
  },
});

/**
 * Sync subscription data from Polar.sh for a specific user
 */
export const syncUserSubscriptionFromPolar = action({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    if (!polarAccessToken || !polarOrgId) {
      throw new ConvexError("Polar.sh API credentials not configured");
    }

    try {
      // Fetch subscriptions from Polar.sh
      const response = await fetch(`https://api.polar.sh/v1/subscriptions?organization_id=${polarOrgId}`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ConvexError(`Polar.sh API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const subscriptions = data.items || [];

      console.log(`Found ${subscriptions.length} subscriptions in Polar.sh`);

      // Find user in Convex
      const user = await ctx.runQuery(api.fixSubscription.findUserByEmail, {
        email: args.userEmail
      });

      if (!user.user) {
        throw new ConvexError(`User with email ${args.userEmail} not found in Convex`);
      }

      // Look for subscriptions that match the user's email
      const userSubscriptions = subscriptions.filter((sub: any) => 
        sub.customer?.email === args.userEmail ||
        sub.metadata?.userEmail === args.userEmail
      );

      console.log(`Found ${userSubscriptions.length} subscriptions for ${args.userEmail}`);

      if (userSubscriptions.length === 0) {
        return {
          success: false,
          message: `No subscriptions found for ${args.userEmail} in Polar.sh`,
          polarSubscriptions: subscriptions.length,
        };
      }

      // Sync each subscription
      const syncResults = [];
      for (const polarSub of userSubscriptions) {
        try {
          // Create or update subscription using the webhook handler
          await ctx.runMutation(api.subscriptions.handleWebhookEvent, {
            body: {
              type: "subscription.created",
              data: polarSub,
            }
          });

          syncResults.push({
            polarId: polarSub.id,
            status: polarSub.status,
            amount: polarSub.amount,
            synced: true,
          });

        } catch (error: any) {
          console.error(`Failed to sync subscription ${polarSub.id}:`, error);
          
          syncResults.push({
            polarId: polarSub.id,
            status: 'error',
            error: error.message,
            synced: false,
          });
        }
      }

      return {
        success: true,
        message: `Synced ${syncResults.filter(r => r.synced).length} of ${syncResults.length} subscriptions`,
        results: syncResults,
        userEmail: args.userEmail,
      };

    } catch (error: any) {
      console.error('Failed to sync subscriptions from Polar:', error);
      throw new ConvexError(`Failed to sync subscriptions: ${error.message}`);
    }
  },
});