import { Polar } from "@polar-sh/sdk";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { api } from "./_generated/api";
import { action, httpAction, mutation, query } from "./_generated/server";
import { requireAdminPermission, PERMISSIONS } from "./permissions";

const createCheckout = async ({
  customerEmail,
  productPriceId,
  successUrl,
  metadata,
}: {
  customerEmail: string;
  productPriceId: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) => {
  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
  const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

  if (!polarAccessToken || !polarOrgId) {
    throw new Error("Polar.sh API credentials not configured");
  }

  try {
    // Get product ID from price ID using direct fetch
    const productsResponse = await fetch(`https://api.polar.sh/v1/products?organization_id=${polarOrgId}&is_archived=false`, {
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    
    let productId = null;
    for (const product of productsData.items || []) {
      const hasPrice = product.prices?.some(
        (price: any) => price.id === productPriceId
      );
      if (hasPrice) {
        productId = product.id;
        break;
      }
    }

    if (!productId) {
      throw new Error(`Product not found for price ID: ${productPriceId}`);
    }

    const checkoutData = {
      products: [productId],
      successUrl: successUrl,
      customerEmail: customerEmail,
      metadata: {
        ...metadata,
        priceId: productPriceId,
      },
    };

    console.log(
      "Creating checkout with data:",
      JSON.stringify(checkoutData, null, 2)
    );
    console.log("Success URL:", successUrl);

    // Create checkout using direct fetch
    const checkoutResponse = await fetch('https://api.polar.sh/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      throw new Error(`Failed to create checkout: ${checkoutResponse.status} ${errorText}`);
    }

    const result = await checkoutResponse.json();
    return result;
  } catch (error) {
    console.error("Error in createCheckout:", error);
    throw error;
  }
};

export const getAvailablePlansQuery = query({
  handler: async (ctx) => {
    const polar = new Polar({
      server: "sandbox",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
    });

    const { result } = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID,
      isArchived: false,
    });

    // Transform the data to remove Date objects and keep only needed fields
    const cleanedItems = result.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      isRecurring: item.isRecurring,
      prices: item.prices.map((price: any) => ({
        id: price.id,
        amount: price.priceAmount,
        currency: price.priceCurrency,
        interval: price.recurringInterval,
      })),
    }));

    return {
      items: cleanedItems,
      pagination: result.pagination,
    };
  },
});

export const getAvailablePlans = action({
  handler: async (ctx) => {
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    if (!polarAccessToken || !polarOrgId) {
      throw new ConvexError("Polar.sh API credentials not configured");
    }

    try {
      // Use direct fetch instead of Polar SDK to avoid token issues
      const response = await fetch(`https://api.polar.sh/v1/products?organization_id=${polarOrgId}&is_archived=false`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Polar.sh API error: ${response.status} ${response.statusText}`);
        throw new ConvexError(`Polar.sh API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the data to match expected format
      const cleanedItems = data.items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isRecurring: item.is_recurring || false,
        prices: item.prices?.map((price: any) => ({
          id: price.id,
          amount: price.amount_type === 'free' ? 0 : (price.amount || price.price_amount || price.unit_amount || 2900),
          currency: price.currency || 'USD',
          interval: price.recurring_interval || 'month',
        })) || [],
      })) || [];

      return {
        items: cleanedItems,
        pagination: data.pagination || { totalCount: cleanedItems.length },
      };
    } catch (error) {
      console.error("Error in getAvailablePlans:", error);
      throw new ConvexError(`Failed to fetch plans: ${error}`);
    }
  },
});

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // First check if user exists
    let user = await ctx.runQuery(api.users.findUserByToken, {
      tokenIdentifier: identity.subject,
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await ctx.runMutation(api.users.upsertUser);

      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    const checkout = await createCheckout({
      customerEmail: user.email!,
      productPriceId: args.priceId,
      successUrl: process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/success` 
        : "http://localhost:5173/success",
      metadata: {
        userId: user.tokenIdentifier,
      },
    });

    return checkout.url;
  },
});

export const checkUserSubscriptionStatus = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tokenIdentifier: string;

    if (args.userId) {
      // Use provided userId directly as tokenIdentifier (they are the same)
      tokenIdentifier = args.userId;
    } else {
      // Fall back to auth context
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { hasActiveSubscription: false };
      }
      tokenIdentifier = identity.subject;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (!user) {
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const checkUserSubscriptionStatusByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk user ID (this assumes the tokenIdentifier contains the Clerk user ID)
    // In Clerk, the subject is typically in the format "user_xxxxx" where xxxxx is the Clerk user ID
    const tokenIdentifier = `user_${args.clerkUserId}`;

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    // If not found with user_ prefix, try the raw userId
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.clerkUserId))
        .unique();
    }

    if (!user) {
      return { hasActiveSubscription: false };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    const hasActiveSubscription = subscription?.status === "active";
    return { hasActiveSubscription };
  },
});

export const fetchUserSubscription = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", user.tokenIdentifier))
      .first();

    return subscription;
  },
});

export const handleWebhookEvent = mutation({
  args: {
    body: v.any(),
  },
  handler: async (ctx, args) => {
    // Extract event type from webhook payload
    const eventType = args.body.type;

    // Store webhook event
    await ctx.db.insert("webhookEvents", {
      type: eventType,
      polarEventId: args.body.data.id,
      createdAt: args.body.data.created_at,
      modifiedAt: args.body.data.modified_at || args.body.data.created_at,
      data: args.body.data,
    });

    switch (eventType) {
      case "subscription.created":
        // Get customer email from various possible sources in webhook data
        let customerEmail = args.body.data.customer?.email || 
                           args.body.data.customer_email ||
                           args.body.data.email;
        
        // If no customer email in the webhook, try to get userId from metadata
        let userId = args.body.data.metadata?.userId;
        
        // If we have customer email but no userId, try to find user by email
        if (customerEmail && !userId) {
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), customerEmail))
            .first();
          
          if (user) {
            userId = user.tokenIdentifier;
            console.log(`Found user ${userId} for email ${customerEmail}`);
          } else {
            console.log(`No user found for email ${customerEmail}`);
          }
        }
        
        console.log("Creating subscription with:", {
          polarId: args.body.data.id,
          userId,
          customerEmail,
          status: args.body.data.status
        });

        // Insert new subscription
        await ctx.db.insert("subscriptions", {
          polarId: args.body.data.id,
          polarPriceId: args.body.data.price_id,
          currency: args.body.data.currency,
          interval: args.body.data.recurring_interval,
          userId: userId,
          customerEmail: customerEmail,
          status: args.body.data.status,
          currentPeriodStart: new Date(
            args.body.data.current_period_start
          ).getTime(),
          currentPeriodEnd: new Date(
            args.body.data.current_period_end
          ).getTime(),
          cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
          amount: args.body.data.amount,
          startedAt: new Date(args.body.data.started_at).getTime(),
          endedAt: args.body.data.ended_at
            ? new Date(args.body.data.ended_at).getTime()
            : undefined,
          canceledAt: args.body.data.canceled_at
            ? new Date(args.body.data.canceled_at).getTime()
            : undefined,
          customerCancellationReason:
            args.body.data.customer_cancellation_reason || undefined,
          customerCancellationComment:
            args.body.data.customer_cancellation_comment || undefined,
          metadata: args.body.data.metadata || {},
          customFieldData: args.body.data.custom_field_data || {},
          customerId: args.body.data.customer_id,
        });
        break;

      case "subscription.updated":
        // Find existing subscription
        const existingSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (existingSub) {
          await ctx.db.patch(existingSub._id, {
            amount: args.body.data.amount,
            status: args.body.data.status,
            currentPeriodStart: new Date(
              args.body.data.current_period_start
            ).getTime(),
            currentPeriodEnd: new Date(
              args.body.data.current_period_end
            ).getTime(),
            cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
            metadata: args.body.data.metadata || {},
            customFieldData: args.body.data.custom_field_data || {},
          });
        }
        break;

      case "subscription.active":
        // Find and update subscription
        const activeSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (activeSub) {
          await ctx.db.patch(activeSub._id, {
            status: args.body.data.status,
            startedAt: new Date(args.body.data.started_at).getTime(),
          });
        }
        break;

      case "subscription.canceled":
        // Find and update subscription
        const canceledSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (canceledSub) {
          await ctx.db.patch(canceledSub._id, {
            status: args.body.data.status,
            canceledAt: args.body.data.canceled_at
              ? new Date(args.body.data.canceled_at).getTime()
              : undefined,
            customerCancellationReason:
              args.body.data.customer_cancellation_reason || undefined,
            customerCancellationComment:
              args.body.data.customer_cancellation_comment || undefined,
          });
        }
        break;

      case "subscription.uncanceled":
        // Find and update subscription
        const uncanceledSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (uncanceledSub) {
          await ctx.db.patch(uncanceledSub._id, {
            status: args.body.data.status,
            cancelAtPeriodEnd: false,
            canceledAt: undefined,
            customerCancellationReason: undefined,
            customerCancellationComment: undefined,
          });
        }
        break;

      case "subscription.revoked":
        // Find and update subscription
        const revokedSub = await ctx.db
          .query("subscriptions")
          .withIndex("polarId", (q) => q.eq("polarId", args.body.data.id))
          .first();

        if (revokedSub) {
          await ctx.db.patch(revokedSub._id, {
            status: "revoked",
            endedAt: args.body.data.ended_at
              ? new Date(args.body.data.ended_at).getTime()
              : undefined,
          });
        }
        break;

      case "order.created":
        // Orders are handled through the subscription events
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
        break;
    }
  },
});

// Use our own validation similar to validateEvent from @polar-sh/sdk/webhooks
// The only diffference is we use btoa to encode the secret since Convex js runtime doesn't support Buffer
const validateEvent = (
  body: string | Buffer,
  headers: Record<string, string>,
  secret: string
) => {
  const base64Secret = btoa(secret);
  const webhook = new Webhook(base64Secret);
  webhook.verify(body, headers);
};

export const paymentWebhook = httpAction(async (ctx, request) => {
  try {
    const rawBody = await request.text();

    // Internally validateEvent uses headers as a dictionary e.g. headers["webhook-id"]
    // So we need to convert the headers to a dictionary
    // (request.headers is a Headers object which is accessed as request.headers.get("webhook-id"))
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Validate the webhook event
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error(
        "POLAR_WEBHOOK_SECRET environment variable is not configured"
      );
    }
    validateEvent(rawBody, headers, process.env.POLAR_WEBHOOK_SECRET);

    const body = JSON.parse(rawBody);

    // track events and based on events store data
    await ctx.runMutation(api.subscriptions.handleWebhookEvent, {
      body,
    });

    return new Response(JSON.stringify({ message: "Webhook received!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response(
        JSON.stringify({ message: "Webhook verification failed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(JSON.stringify({ message: "Webhook failed" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});

export const createCustomerPortalUrl = action({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const polar = new Polar({
      server: "sandbox",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
    });

    try {
      const result = await polar.customerSessions.create({
        customerId: args.customerId,
      });

      // Only return the URL to avoid Convex type issues
      return { url: result.customerPortalUrl };
    } catch (error) {
      console.error("Error creating customer session:", error);
      throw new Error("Failed to create customer session");
    }
  },
});

/**
 * Get all subscriptions with pagination and search (Admin function)
 */
export const getAllSubscriptions = query({
  args: {
    adminId: v.string(),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    interval: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_SUBSCRIPTIONS);

    let query = ctx.db.query("subscriptions");

    // Apply filters
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.interval) {
      query = query.filter((q) => q.eq(q.field("interval"), args.interval));
    }

    let subscriptions = await query.collect();

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      const userIds = subscriptions.map(sub => sub.userId);
      
      // Get users for search
      const users = await Promise.all(
        userIds.map(async (userId) => {
          return await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("tokenIdentifier"), userId))
            .first();
        })
      );

      subscriptions = subscriptions.filter((sub, index) => {
        const user = users[index];
        return (
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          sub.customerId?.toLowerCase().includes(searchLower) ||
          sub.polarId?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by creation date (most recent first)
    subscriptions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedSubscriptions = subscriptions.slice(offset, offset + limit);

    // Get user information for each subscription
    const subscriptionsWithUserInfo = await Promise.all(
      paginatedSubscriptions.map(async (subscription) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("tokenIdentifier"), subscription.userId))
          .first();

        return {
          ...subscription,
          user: user ? {
            name: user.name,
            email: user.email,
            tokenIdentifier: user.tokenIdentifier,
          } : null,
        };
      })
    );

    return {
      subscriptions: subscriptionsWithUserInfo,
      total: subscriptions.length,
      hasMore: offset + limit < subscriptions.length,
    };
  },
});

/**
 * Get subscription analytics (Admin function)
 */
export const getSubscriptionAnalytics = query({
  args: {
    adminId: v.string(),
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const now = Date.now();
    const period = args.period || "month";
    
    let periodStart: number;
    switch (period) {
      case "week":
        periodStart = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        periodStart = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        periodStart = now - 365 * 24 * 60 * 60 * 1000;
        break;
    }

    const allSubscriptions = await ctx.db.query("subscriptions").collect();
    
    const analytics = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(s => s.status === "active").length,
      canceled: allSubscriptions.filter(s => s.status === "canceled").length,
      pastDue: allSubscriptions.filter(s => s.status === "past_due").length,
      incomplete: allSubscriptions.filter(s => s.status === "incomplete").length,
      
      // Revenue calculations
      totalRevenue: allSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0),
      activeRevenue: allSubscriptions
        .filter(s => s.status === "active")
        .reduce((sum, sub) => sum + (sub.amount || 0), 0),
      
      // Period-specific metrics
      newSubscriptions: allSubscriptions.filter(s => 
        s.startedAt && s.startedAt > periodStart
      ).length,
      canceledInPeriod: allSubscriptions.filter(s => 
        s.canceledAt && s.canceledAt > periodStart
      ).length,
      
      // Revenue by interval
      revenueByInterval: {
        monthly: allSubscriptions
          .filter(s => s.interval === "month" && s.status === "active")
          .reduce((sum, sub) => sum + (sub.amount || 0), 0),
        yearly: allSubscriptions
          .filter(s => s.interval === "year" && s.status === "active")
          .reduce((sum, sub) => sum + (sub.amount || 0), 0),
      },
      
      // Churn rate calculation
      churnRate: allSubscriptions.length > 0 
        ? (allSubscriptions.filter(s => s.canceledAt && s.canceledAt > periodStart).length / 
           allSubscriptions.filter(s => s.startedAt && s.startedAt <= periodStart).length) * 100
        : 0,
    };

    return analytics;
  },
});

/**
 * Cancel subscription (Admin function)
 */
export const cancelSubscription = mutation({
  args: {
    adminId: v.string(),
    subscriptionId: v.id("subscriptions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.MANAGE_SUBSCRIPTIONS);

    const subscription = await ctx.db.get(args.subscriptionId);
    
    if (!subscription) {
      throw new ConvexError("Subscription not found");
    }

    if (subscription.status === "canceled") {
      throw new ConvexError("Subscription is already canceled");
    }

    // Update subscription in database
    await ctx.db.patch(args.subscriptionId, {
      status: "canceled",
      canceledAt: Date.now(),
      customerCancellationReason: "admin_canceled",
      customerCancellationComment: args.reason,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "cancel_subscription",
      target: "subscription",
      targetId: subscription.polarId || subscription._id,
      details: { 
        reason: args.reason, 
        userId: subscription.userId,
        amount: subscription.amount,
        interval: subscription.interval,
      },
    });

    return true;
  },
});

/**
 * Get revenue data for charts (Admin function)
 */
export const getRevenueData = query({
  args: {
    adminId: v.string(),
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const now = Date.now();
    let periodMs: number;
    let intervals: number;
    
    switch (args.period) {
      case "7d":
        periodMs = 7 * 24 * 60 * 60 * 1000;
        intervals = 7;
        break;
      case "30d":
        periodMs = 30 * 24 * 60 * 60 * 1000;
        intervals = 30;
        break;
      case "90d":
        periodMs = 90 * 24 * 60 * 60 * 1000;
        intervals = 90;
        break;
      case "1y":
        periodMs = 365 * 24 * 60 * 60 * 1000;
        intervals = 12; // Monthly intervals for yearly view
        break;
    }

    const startTime = now - periodMs;
    const intervalMs = periodMs / intervals;

    const subscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.and(
        q.gte(q.field("startedAt"), startTime),
        q.eq(q.field("status"), "active")
      ))
      .collect();

    // Create time series data
    const revenueData = [];
    for (let i = 0; i < intervals; i++) {
      const intervalStart = startTime + i * intervalMs;
      const intervalEnd = intervalStart + intervalMs;
      
      const intervalRevenue = subscriptions
        .filter(s => s.startedAt && s.startedAt >= intervalStart && s.startedAt < intervalEnd)
        .reduce((sum, sub) => sum + (sub.amount || 0), 0);

      revenueData.push({
        date: new Date(intervalStart).toISOString().split('T')[0],
        revenue: intervalRevenue,
        subscriptions: subscriptions.filter(s => 
          s.startedAt && s.startedAt >= intervalStart && s.startedAt < intervalEnd
        ).length,
      });
    }

    return revenueData;
  },
});

/**
 * Get churn analysis (Admin function)
 */
export const getChurnAnalysis = query({
  args: {
    adminId: v.string(),
    period: v.optional(v.union(v.literal("month"), v.literal("quarter"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const now = Date.now();
    const period = args.period || "month";
    
    let periodMs: number;
    switch (period) {
      case "month":
        periodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "quarter":
        periodMs = 90 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        periodMs = 365 * 24 * 60 * 60 * 1000;
        break;
    }

    const periodStart = now - periodMs;
    
    const allSubscriptions = await ctx.db.query("subscriptions").collect();
    
    // Active at start of period
    const activeAtStart = allSubscriptions.filter(s => 
      s.startedAt && s.startedAt <= periodStart && 
      (!s.canceledAt || s.canceledAt > periodStart)
    );
    
    // Canceled during period
    const canceledInPeriod = allSubscriptions.filter(s => 
      s.canceledAt && s.canceledAt > periodStart && s.canceledAt <= now &&
      s.startedAt && s.startedAt <= periodStart
    );
    
    // New subscriptions in period
    const newInPeriod = allSubscriptions.filter(s => 
      s.startedAt && s.startedAt > periodStart && s.startedAt <= now
    );

    const churnRate = activeAtStart.length > 0 
      ? (canceledInPeriod.length / activeAtStart.length) * 100 
      : 0;

    const growthRate = activeAtStart.length > 0 
      ? (newInPeriod.length / activeAtStart.length) * 100 
      : 0;

    // Analyze cancellation reasons
    const cancellationReasons = canceledInPeriod.reduce((acc, sub) => {
      const reason = sub.customerCancellationReason || "unknown";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: args.period,
      churnRate: Math.round(churnRate * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      activeAtStart: activeAtStart.length,
      canceledInPeriod: canceledInPeriod.length,
      newInPeriod: newInPeriod.length,
      netGrowth: newInPeriod.length - canceledInPeriod.length,
      cancellationReasons,
      
      // Revenue impact
      lostRevenue: canceledInPeriod.reduce((sum, sub) => sum + (sub.amount || 0), 0),
      gainedRevenue: newInPeriod.reduce((sum, sub) => sum + (sub.amount || 0), 0),
    };
  },
});

/**
 * Get subscription detail (Admin function)
 */
export const getSubscriptionDetail = query({
  args: {
    adminId: v.string(),
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_SUBSCRIPTIONS);

    const subscription = await ctx.db.get(args.subscriptionId);
    
    if (!subscription) {
      throw new ConvexError("Subscription not found");
    }

    // Get user information
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), subscription.userId))
      .first();

    // Get related webhook events
    const webhookEvents = await ctx.db
      .query("webhookEvents")
      .filter((q) => q.eq(q.field("polarEventId"), subscription.polarId))
      .order("desc")
      .take(10);

    return {
      ...subscription,
      user: user ? {
        name: user.name,
        email: user.email,
        tokenIdentifier: user.tokenIdentifier,
        createdAt: user.createdAt,
      } : null,
      webhookEvents,
    };
  },
});

/**
 * Search subscriptions (Admin function)
 */
export const searchSubscriptions = query({
  args: {
    adminId: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_SUBSCRIPTIONS);

    const allSubscriptions = await ctx.db.query("subscriptions").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    // Get all users to search in their info
    const userIds = [...new Set(allSubscriptions.map(sub => sub.userId))];
    const users = await Promise.all(
      userIds.map(async (userId) => {
        return await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("tokenIdentifier"), userId))
          .first();
      })
    );
    
    const userMap = new Map();
    users.forEach((user, index) => {
      if (user) {
        userMap.set(userIds[index], user);
      }
    });

    const filteredSubscriptions = allSubscriptions
      .filter(subscription => {
        const user = userMap.get(subscription.userId);
        return (
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          subscription.customerId?.toLowerCase().includes(searchLower) ||
          subscription.polarId?.toLowerCase().includes(searchLower) ||
          subscription.status?.toLowerCase().includes(searchLower) ||
          subscription.interval?.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, args.limit || 20)
      .map(subscription => ({
        ...subscription,
        user: userMap.get(subscription.userId) || null,
      }));

    return filteredSubscriptions;
  },
});
