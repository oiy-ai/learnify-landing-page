import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requireAdminPermission, PERMISSIONS, ROLE_PERMISSIONS } from "./permissions";
import { api } from "./_generated/api";

/**
 * Initial admin setup (for first-time setup when no admins exist)
 */
export const initialAdminSetup = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any super admins already exist
    const existingSuperAdmins = await ctx.db
      .query("admins")
      .filter((q) => q.and(
        q.eq(q.field("role"), "super_admin"),
        q.eq(q.field("isActive"), true)
      ))
      .collect();

    // If super admins exist, require permission
    if (existingSuperAdmins.length > 0) {
      throw new ConvexError("Super admin already exists. Use promoteUserToAdmin instead.");
    }

    // Check if target user exists
    const targetUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Check if user is already an admin
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingAdmin) {
      throw new ConvexError("User is already an admin");
    }

    // Create admin record with all permissions
    const adminId = await ctx.db.insert("admins", {
      userId: args.userId,
      role: "super_admin",
      permissions: Object.values(PERMISSIONS),
      createdAt: Date.now(),
      createdBy: args.userId, // Self-created for initial setup
      isActive: true,
    });

    // Update user role
    await ctx.db.patch(targetUser._id, {
      role: "super_admin",
    });

    // Log the action
    await ctx.db.insert("audit_logs", {
      adminId: args.userId,
      action: "INITIAL_ADMIN_SETUP",
      target: "admin",
      targetId: args.userId,
      details: {
        role: "super_admin",
        permissions: Object.values(PERMISSIONS),
      },
      timestamp: Date.now(),
    });

    return { success: true, adminId };
  },
});

/**
 * Promote a user to admin role
 */
export const promoteUserToAdmin = mutation({
  args: {
    targetUserId: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("support")),
    promotedBy: v.string(), // Admin user ID who is performing the promotion
  },
  handler: async (ctx, args) => {
    // Check if the promoter has admin management permissions
    await requireAdminPermission(ctx, args.promotedBy, PERMISSIONS.MANAGE_ADMINS);

    // Check if target user exists
    const targetUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.targetUserId))
      .first();

    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // Check if user is already an admin
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (existingAdmin) {
      throw new ConvexError("User is already an admin");
    }

    // Get permissions for the role
    const permissions = ROLE_PERMISSIONS[args.role] || [];

    // Create admin record
    const adminId = await ctx.db.insert("admins", {
      userId: args.targetUserId,
      role: args.role,
      permissions: [...permissions],
      createdAt: Date.now(),
      createdBy: args.promotedBy,
      isActive: true,
    });

    // Update user role
    const userId = targetUser._id;
    await ctx.db.patch(userId, {
      role: args.role === "support" ? "admin" : args.role,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.promotedBy,
      action: "promote_to_admin",
      target: "user",
      targetId: args.targetUserId,
      details: { role: args.role, adminRecordId: adminId },
    });

    return adminId;
  },
});

/**
 * Revoke admin access from a user
 */
export const revokeAdminAccess = mutation({
  args: {
    targetUserId: v.string(),
    revokedBy: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if the revoker has admin management permissions
    await requireAdminPermission(ctx, args.revokedBy, PERMISSIONS.MANAGE_ADMINS);

    // Find the admin record
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      throw new ConvexError("User is not an admin");
    }

    // Prevent self-revocation of super_admin
    if (args.targetUserId === args.revokedBy && admin.role === "super_admin") {
      throw new ConvexError("Super admin cannot revoke their own access");
    }

    // Deactivate admin record
    await ctx.db.patch(admin._id, {
      isActive: false,
    });

    // Update user role back to regular user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.targetUserId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        role: "user",
      });
    }

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.revokedBy,
      action: "revoke_admin_access",
      target: "user",
      targetId: args.targetUserId,
      details: { reason: args.reason, previousRole: admin.role },
    });

    return true;
  },
});

/**
 * Update admin permissions
 */
export const updateAdminPermissions = mutation({
  args: {
    targetUserId: v.string(),
    permissions: v.array(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the updater has admin management permissions
    await requireAdminPermission(ctx, args.updatedBy, PERMISSIONS.MANAGE_ADMINS);

    // Find the admin record
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      throw new ConvexError("User is not an admin");
    }

    // Update permissions
    await ctx.db.patch(admin._id, {
      permissions: args.permissions,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.updatedBy,
      action: "update_admin_permissions",
      target: "admin",
      targetId: args.targetUserId,
      details: { 
        previousPermissions: admin.permissions, 
        newPermissions: args.permissions 
      },
    });

    return true;
  },
});

/**
 * Get all admins with their user information
 */
export const getAllAdmins = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("admins");

    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const admins = await query.collect();

    // Get user details for each admin
    const adminsWithUsers = await Promise.all(
      admins.map(async (admin) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("tokenIdentifier"), admin.userId))
          .first();

        return {
          ...admin,
          user,
        };
      })
    );

    return adminsWithUsers;
  },
});

/**
 * Get admin profile information
 */
export const getAdminProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    const createdByUser = admin.createdBy ? await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), admin.createdBy!))
      .first() : null;

    return {
      ...admin,
      user,
      createdByUser,
    };
  },
});

/**
 * Create initial super admin (for setup)
 */
export const createInitialSuperAdmin = mutation({
  args: {
    userId: v.string(),
    setupKey: v.string(), // Secret key for initial setup
  },
  handler: async (ctx, args) => {
    // Check setup key (you should set this as an environment variable)
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY || "setup-admin-2024";
    if (args.setupKey !== expectedSetupKey) {
      throw new ConvexError("Invalid setup key");
    }

    // Check if any super admin already exists
    const existingSuperAdmin = await ctx.db
      .query("admins")
      .withIndex("by_role", (q) => q.eq("role", "super_admin"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingSuperAdmin) {
      throw new ConvexError("Super admin already exists");
    }

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Create super admin
    const adminId = await ctx.db.insert("admins", {
      userId: args.userId,
      role: "super_admin",
      permissions: ROLE_PERMISSIONS.super_admin,
      createdAt: Date.now(),
      isActive: true,
    });

    // Update user role
    await ctx.db.patch(user._id, {
      role: "super_admin",
    });

    return adminId;
  },
});

/**
 * Check if user can access admin panel
 */
export const canAccessAdminPanel = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      return {
        canAccess: false,
        role: null,
        permissions: [],
      };
    }

    // Super admin gets all permissions
    const permissions = admin.role === "super_admin" 
      ? Object.values(PERMISSIONS)
      : admin.permissions;

    return {
      canAccess: true,
      role: admin.role,
      permissions: permissions,
    };
  },
});

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboardStats = query({
  args: { adminId: v.string() },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get user statistics
    const totalUsers = await ctx.db.query("users").collect();
    const activeUsers = totalUsers.filter(user => user.isActive !== false);
    const newUsersToday = totalUsers.filter(user => 
      user.createdAt && user.createdAt > dayAgo
    );

    // Get subscription statistics
    const subscriptions = await ctx.db.query("subscriptions").collect();
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === "active"
    );

    // Get admin activities from today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTimestamp = startOfToday.getTime();

    const activitiesToday = await ctx.db
      .query("audit_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), startOfTodayTimestamp))
      .collect();

    return {
      users: {
        total: totalUsers.length,
        active: activeUsers.length,
        newToday: newUsersToday.length,
      },
      subscriptions: {
        total: subscriptions.length,
        active: activeSubscriptions.length,
      },
      recentActivities: activitiesToday.length,
    };
  },
});

/**
 * Get recent admin activities for dashboard
 */
export const getRecentAdminActivities = query({
  args: { 
    adminId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_AUDIT_LOGS);

    // Get recent admin activities
    const activities = await ctx.db
      .query("audit_logs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 10);

    // Enrich activities with user information
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        // Get admin user info
        const admin = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("tokenIdentifier"), activity.adminId))
          .first();

        // Get target user info if target is user-related
        let targetUser = null;
        if (activity.target === "user" && activity.targetId) {
          targetUser = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("tokenIdentifier"), activity.targetId))
            .first();
        }

        return {
          ...activity,
          admin: admin ? {
            name: admin.name,
            email: admin.email
          } : null,
          targetUser: targetUser ? {
            name: targetUser.name,
            email: targetUser.email
          } : null
        };
      })
    );

    return enrichedActivities;
  },
});

/**
 * Initialize the first super admin - only works if no admins exist
 */
export const initializeFirstSuperAdmin = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admins already exist
    const existingAdmins = await ctx.db.query("admins").collect();
    
    if (existingAdmins.length > 0) {
      throw new ConvexError("Admin system already initialized. Use standard admin promotion instead.");
    }

    // Find the user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.userEmail))
      .first();

    if (!user) {
      throw new ConvexError(`User with email ${args.userEmail} not found. Please ensure the user has logged in at least once.`);
    }

    // Create the super admin record
    const adminId = await ctx.db.insert("admins", {
      userId: user.tokenIdentifier,
      role: "super_admin",
      permissions: ROLE_PERMISSIONS.super_admin,
      isActive: true,
      createdAt: Date.now(),
      createdBy: "system_initialization",
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: user.tokenIdentifier,
      action: "initialize_super_admin",
      target: "admin",
      targetId: adminId,
      details: { 
        reason: "System initialization",
        email: args.userEmail,
        role: "super_admin"
      },
    });

    return {
      success: true,
      message: `Successfully initialized ${args.userEmail} as the first super admin`,
      adminId,
    };
  },
});

/**
 * Debug function to check current user info (for setup only)
 */
export const debugCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return { error: "No user identity found" };
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.subject))
      .first();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      clerkUserId: identity.subject,
      clerkEmail: identity.email,
      clerkName: identity.name,
      convexUser: user,
      adminRecord: admin,
      hasAdmin: !!admin,
    };
  },
});