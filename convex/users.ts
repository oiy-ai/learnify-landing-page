import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAdminPermission, PERMISSIONS } from "./permissions";
import { api } from "./_generated/api";

/**
 * Get current user (for authenticated user)
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    // Find user by token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    return user;
  },
});

export const findUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    // Get the user's identity from the auth context
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user !== null) {
      return user;
    }

    return null;
  },
});

export const upsertUser = mutation({
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

    if (existingUser) {
      // Update if needed
      if (
        existingUser.name !== identity.name ||
        existingUser.email !== identity.email
      ) {
        await ctx.db.patch(existingUser._id, {
          name: identity.name,
          email: identity.email,
        });
      }
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      tokenIdentifier: identity.subject,
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Get all users with pagination and search (Admin function)
 */
export const getAllUsers = query({
  args: {
    adminId: v.string(),
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_USERS);

    let query = ctx.db.query("users");

    // Apply filters
    if (args.role) {
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    }

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    let users = await query.collect();

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.tokenIdentifier.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedUsers = users.slice(offset, offset + limit);

    // Get admin records for users who are admins
    const usersWithAdminInfo = await Promise.all(
      paginatedUsers.map(async (user) => {
        const adminRecord = await ctx.db
          .query("admins")
          .withIndex("by_user", (q) => q.eq("userId", user.tokenIdentifier))
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();

        return {
          ...user,
          adminRecord,
        };
      })
    );

    return {
      users: usersWithAdminInfo,
      total: users.length,
      hasMore: offset + limit < users.length,
    };
  },
});

/**
 * Get user detail (Admin function)
 */
export const getUserDetail = query({
  args: {
    adminId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get admin record if user is admin
    const adminRecord = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // Get user's subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user sessions
    const sessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      ...user,
      adminRecord,
      subscriptions,
      sessions,
    };
  },
});

/**
 * Update user status (Admin function)
 */
export const updateUserStatus = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    isActive: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update user status
    await ctx.db.patch(user._id, {
      isActive: args.isActive,
    });

    // If deactivating admin, also deactivate admin record
    if (!args.isActive) {
      const adminRecord = await ctx.db
        .query("admins")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (adminRecord) {
        await ctx.db.patch(adminRecord._id, {
          isActive: false,
        });
      }

      // Deactivate user sessions
      const sessions = await ctx.db
        .query("user_sessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      for (const session of sessions) {
        await ctx.db.patch(session._id, {
          isActive: false,
        });
      }
    }

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: args.isActive ? "activate_user" : "deactivate_user",
      target: "user",
      targetId: args.userId,
      details: { reason: args.reason, previousStatus: user.isActive },
    });

    return true;
  },
});

/**
 * Delete user (Admin function)
 */
export const deleteUser = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.DELETE_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Prevent deleting super admin
    if (user.role === "super_admin") {
      throw new ConvexError("Cannot delete super admin");
    }

    // Delete admin record if exists
    const adminRecord = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (adminRecord) {
      await ctx.db.delete(adminRecord._id);
    }

    // Delete user sessions
    const sessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Log the action before deletion
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "delete_user",
      target: "user",
      targetId: args.userId,
      details: { reason: args.reason, userEmail: user.email, userName: user.name },
    });

    // Delete the user
    await ctx.db.delete(user._id);

    return true;
  },
});

/**
 * Search users (Admin function)
 */
export const searchUsers = query({
  args: {
    adminId: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_USERS);

    const users = await ctx.db.query("users").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    const filteredUsers = users
      .filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.tokenIdentifier.toLowerCase().includes(searchLower)
      )
      .slice(0, args.limit || 20);

    return filteredUsers;
  },
});

/**
 * Get user activity (Admin function)
 */
export const getUserActivity = query({
  args: {
    adminId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_USER_SESSIONS);

    // Get user sessions
    const sessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    // Get audit logs where user was the target
    const auditLogs = await ctx.db
      .query("audit_logs")
      .withIndex("by_target", (q) => q.eq("target", "user"))
      .filter((q) => q.eq(q.field("targetId"), args.userId))
      .order("desc")
      .take(args.limit || 10);

    return {
      sessions,
      auditLogs,
    };
  },
});

/**
 * Get user statistics (Admin function)
 */
export const getUserStats = query({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allUsers = await ctx.db.query("users").collect();
    
    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => u.isActive !== false).length,
      inactive: allUsers.filter(u => u.isActive === false).length,
      admins: allUsers.filter(u => u.role && u.role !== "user").length,
      newToday: allUsers.filter(u => u.createdAt && u.createdAt > dayAgo).length,
      newThisWeek: allUsers.filter(u => u.createdAt && u.createdAt > weekAgo).length,
      newThisMonth: allUsers.filter(u => u.createdAt && u.createdAt > monthAgo).length,
    };

    return stats;
  },
});

/**
 * Update user's Retell API key (User function)
 */
export const updateRetellApiKey = mutation({
  args: {
    retell_api_key: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new ConvexError("User not authenticated");
    }

    // Find user by token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update the user's Retell API key
    await ctx.db.patch(user._id, {
      retell_api_key: args.retell_api_key,
    });

    return true;
  },
});

/**
 * Get user's Retell API key (User function)
 */
export const getRetellApiKey = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    // Find user by token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    return {
      retell_api_key: user.retell_api_key || null,
      hasKey: !!user.retell_api_key,
    };
  },
});

/**
 * Update user's Retell API key (Admin function)
 */
export const updateUserRetellApiKey = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    retell_api_key: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update the user's Retell API key
    await ctx.db.patch(user._id, {
      retell_api_key: args.retell_api_key,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_retell_api_key",
      target: "user",
      targetId: args.userId,
      details: { 
        hasKey: !!args.retell_api_key,
        keyLength: args.retell_api_key.length 
      },
    });

    return true;
  },
});

/**
 * Update user's user_agent_json (Admin function)
 */
export const updateUserAgentJson = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    user_agent_json: v.any(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      user_agent_json: args.user_agent_json,
    });

    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_user_agent_json",
      target: "user",
      targetId: args.userId,
      details: {
        hasJson: args.user_agent_json !== undefined && args.user_agent_json !== null,
      },
    });

    return true;
  },
});

/**
 * Remove user's Retell API key (User function)
 */
export const removeRetellApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new ConvexError("User not authenticated");
    }

    // Find user by token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Remove the user's Retell API key
    await ctx.db.patch(user._id, {
      retell_api_key: undefined,
    });

    return true;
  },
});

/**
 * Service endpoint: Update user's user_agent_json and/or shop_info via service token
 * Intended for server-to-server integration through HTTP route
 */
export const serviceUpdateUserAgentAndShop = mutation({
  args: {
    serviceToken: v.string(),
    userId: v.string(),
    user_agent_json: v.optional(v.any()),
    shop_info: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expectedToken = process.env.EXTERNAL_API_TOKEN;

    if (!expectedToken) {
      throw new ConvexError("Server misconfiguration: missing EXTERNAL_API_TOKEN");
    }

    if (args.serviceToken !== expectedToken) {
      throw new ConvexError("Unauthorized: invalid service token");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const patch: Record<string, any> = {};
    if (args.user_agent_json !== undefined) {
      patch.user_agent_json = args.user_agent_json;
    }
    if (args.shop_info !== undefined) {
      patch.shop_info = args.shop_info;
    }

    if (Object.keys(patch).length === 0) {
      return { success: true, updated: false };
    }

    await ctx.db.patch(user._id, patch);

    return { success: true, updated: true };
  },
});
