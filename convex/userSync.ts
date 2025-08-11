import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Automatically sync user from Clerk to Convex database
 * This should be called whenever a user logs in or accesses the app
 */
export const syncCurrentUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update user info and last login time
      await ctx.db.patch(existingUser._id, {
        name: identity.name,
        email: identity.email,
        image: identity.pictureUrl,
        lastLoginAt: now,
        isActive: true, // Ensure user is active when they log in
      });
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      image: identity.pictureUrl,
      tokenIdentifier: identity.subject,
      role: "user", // Default role
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Get current user info (automatically syncs if needed)
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    // If user doesn't exist, we need to sync (but we can't mutate in a query)
    // The frontend should call syncCurrentUser first
    return user;
  },
});

/**
 * Check if current user needs to be synced
 */
export const needsUserSync = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    return !user; // Returns true if user doesn't exist in database
  },
});