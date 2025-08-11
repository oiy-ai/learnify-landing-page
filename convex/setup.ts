import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ROLE_PERMISSIONS } from "./permissions";

/**
 * Setup function to create the first admin user
 * This should only be used during initial setup
 */
export const createFirstAdmin = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if any admin already exists
    const existingAdmin = await ctx.db.query("admins").first();
    
    if (existingAdmin) {
      throw new Error("Admin user already exists. Use the admin panel to manage additional admins.");
    }

    // Create the user record if it doesn't exist
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        tokenIdentifier: args.userId,
        email: args.email,
        name: args.name,
        role: "super_admin",
        isActive: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    } else {
      // Update existing user to super_admin
      await ctx.db.patch(existingUser._id, {
        role: "super_admin",
        isActive: true,
      });
    }

    // Create admin record
    const adminId = await ctx.db.insert("admins", {
      userId: args.userId,
      role: "super_admin",
      permissions: ROLE_PERMISSIONS.super_admin,
      createdAt: Date.now(),
      isActive: true,
    });

    // Log the action
    await ctx.db.insert("audit_logs", {
      adminId: args.userId,
      action: "create_first_admin",
      target: "admin",
      targetId: adminId,
      details: {
        email: args.email,
        name: args.name,
        role: "super_admin",
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "First admin user created successfully",
      adminId,
    };
  },
});

/**
 * Check if the current user is an admin
 */
export const checkCurrentUserAdmin = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.userId))
      .first();

    return {
      isAdmin: !!admin,
      adminRole: admin?.role,
      userRole: user?.role,
      permissions: admin?.permissions || [],
      user: user ? {
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      } : null,
    };
  },
});