import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

// Permission constants
export const PERMISSIONS = {
  // Page access permissions
  PAGE_ADMIN_DASHBOARD: "page_admin_dashboard",
  PAGE_ADMIN_USERS: "page_admin_users",
  PAGE_ADMIN_SUBSCRIPTIONS: "page_admin_subscriptions",
  PAGE_ADMIN_PRODUCTS: "page_admin_products",
  PAGE_ADMIN_ANALYTICS: "page_admin_analytics",
  PAGE_ADMIN_SETTINGS: "page_admin_settings",
  PAGE_ADMIN_PERMISSIONS: "page_admin_permissions",
  PAGE_ADMIN_SECURITY: "page_admin_security",
  PAGE_ADMIN_PERFORMANCE: "page_admin_performance",
  PAGE_ADMIN_POLAR_SETUP: "page_admin_polar_setup",
  
  // User dashboard permissions
  ACCESS_DASHBOARD: "access_dashboard",
  ACCESS_CHAT: "access_chat",
  ACCESS_USER_SETTINGS: "access_user_settings",
  EDIT_PROFILE: "edit_profile",
  CHANGE_PASSWORD: "change_password",
  
  // User content permissions
  CREATE_CONTENT: "create_content",
  EDIT_OWN_CONTENT: "edit_own_content",
  DELETE_OWN_CONTENT: "delete_own_content",
  SHARE_CONTENT: "share_content",
  
  // User subscription permissions
  VIEW_OWN_SUBSCRIPTION: "view_own_subscription",
  MANAGE_OWN_SUBSCRIPTION: "manage_own_subscription",
  CANCEL_OWN_SUBSCRIPTION: "cancel_own_subscription",
  
  // User API permissions
  USE_API: "use_api",
  EXPORT_OWN_DATA: "export_own_data",
  
  // User management
  VIEW_USERS: "view_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  MANAGE_USER_ROLES: "manage_user_roles",
  
  // Subscription management
  VIEW_SUBSCRIPTIONS: "view_subscriptions",
  EDIT_SUBSCRIPTIONS: "edit_subscriptions",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  CANCEL_SUBSCRIPTIONS: "cancel_subscriptions",
  REFUND_SUBSCRIPTIONS: "refund_subscriptions",
  
  // Product management
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",
  
  // Analytics and reporting
  VIEW_ANALYTICS: "view_analytics",
  EXPORT_DATA: "export_data",
  
  // System administration
  MANAGE_ADMINS: "manage_admins",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  SYSTEM_SETTINGS: "system_settings",
  
  // Support functions
  CUSTOMER_SUPPORT: "customer_support",
  VIEW_USER_SESSIONS: "view_user_sessions",
} as const;

// Role permission mappings
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    // Page access permissions
    PERMISSIONS.PAGE_ADMIN_DASHBOARD,
    PERMISSIONS.PAGE_ADMIN_USERS,
    PERMISSIONS.PAGE_ADMIN_SUBSCRIPTIONS,
    PERMISSIONS.PAGE_ADMIN_PRODUCTS,
    PERMISSIONS.PAGE_ADMIN_ANALYTICS,
    PERMISSIONS.PAGE_ADMIN_SETTINGS,
    PERMISSIONS.PAGE_ADMIN_PERMISSIONS,
    PERMISSIONS.PAGE_ADMIN_SECURITY,
    PERMISSIONS.PAGE_ADMIN_PERFORMANCE,
    PERMISSIONS.PAGE_ADMIN_POLAR_SETUP,
    
    // Functional permissions
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.EDIT_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.CANCEL_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.CUSTOMER_SUPPORT,
    PERMISSIONS.VIEW_USER_SESSIONS,
  ],
  support: [
    // Page access permissions
    PERMISSIONS.PAGE_ADMIN_DASHBOARD,
    PERMISSIONS.PAGE_ADMIN_USERS,
    PERMISSIONS.PAGE_ADMIN_SUBSCRIPTIONS,
    
    // Functional permissions
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_SUBSCRIPTIONS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CUSTOMER_SUPPORT,
    PERMISSIONS.VIEW_USER_SESSIONS,
  ],
  user: [
    // User dashboard permissions
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_CHAT,
    PERMISSIONS.ACCESS_USER_SETTINGS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // User content permissions
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_OWN_CONTENT,
    PERMISSIONS.DELETE_OWN_CONTENT,
    PERMISSIONS.SHARE_CONTENT,
    
    // User subscription permissions
    PERMISSIONS.VIEW_OWN_SUBSCRIPTION,
    PERMISSIONS.MANAGE_OWN_SUBSCRIPTION,
    PERMISSIONS.CANCEL_OWN_SUBSCRIPTION,
    
    // User API permissions
    PERMISSIONS.USE_API,
    PERMISSIONS.EXPORT_OWN_DATA,
  ],
} as const;

/**
 * Check if a user has admin permissions
 */
export const checkAdminPermission = query({
  args: { 
    userId: v.string(),
    permission: v.string()
  },
  handler: async (ctx, args) => {
    // Get user's admin record
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      return false;
    }

    // Super admin has all permissions
    if (admin.role === "super_admin") {
      return true;
    }

    // Check if admin has specific permission
    return admin.permissions.includes(args.permission);
  },
});

/**
 * Get admin profile with permissions
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.userId))
      .first();

    return {
      ...admin,
      user,
    };
  },
});

/**
 * Middleware function to check admin permissions (for queries and mutations)
 */
export async function requireAdminPermission(
  ctx: any,
  userId: string,
  permission: string
) {
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .first();

  if (!admin) {
    throw new ConvexError("Access denied: Admin privileges required");
  }

  // Super admin has all permissions
  if (admin.role === "super_admin") {
    return admin;
  }

  if (!admin.permissions.includes(permission)) {
    throw new ConvexError(`Access denied: Missing permission '${permission}'`);
  }

  return admin;
}

/**
 * Middleware function to check admin permissions (for actions)
 */
export async function requireAdminPermissionAction(
  ctx: any,
  userId: string,
  permission: string
) {
  // In actions, we need to use runQuery to access the database
  const admin = await ctx.runQuery(api.permissions.checkAdminPermission, {
    userId,
    permission
  });

  if (!admin) {
    throw new ConvexError("Access denied: Admin privileges required");
  }

  return admin;
}

/**
 * Check if user has any admin role
 */
export const isAdmin = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return !!admin;
  },
});

/**
 * Check if a user has a specific permission (works for both admin and regular users)
 */
export const checkUserPermission = query({
  args: { 
    userId: v.string(),
    permission: v.string()
  },
  handler: async (ctx, args) => {
    // First check if user is an admin
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (admin) {
      // Super admin has all permissions
      if (admin.role === "super_admin") {
        return true;
      }
      // Check if admin has specific permission
      return admin.permissions.includes(args.permission);
    }

    // For regular users, check user role permissions
    const userRoleConfig = await ctx.db
      .query("user_role_permissions")
      .withIndex("by_role", (q) => q.eq("role", "user"))
      .first();
    
    if (!userRoleConfig) {
      // If no user role config exists, use default permissions
      return ROLE_PERMISSIONS.user.includes(args.permission as any);
    }

    return userRoleConfig.permissions.includes(args.permission);
  },
});

/**
 * Get all permissions for a role
 */
export const getRolePermissions = query({
  args: { role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("support"), v.literal("user")) },
  handler: async (ctx, args) => {
    return ROLE_PERMISSIONS[args.role] || [];
  },
});

/**
 * Get permissions for role template (used by permissions management UI)
 */
export const getPermissionsForRoleTemplate = query({
  args: { role: v.union(v.literal("admin"), v.literal("support"), v.literal("user")) },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Get admin record to check role
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      throw new ConvexError("Not an admin");
    }

    // Super admin can manage permissions, others need specific permission
    if (admin.role !== "super_admin") {
      await requireAdminPermission(ctx, identity.subject, PERMISSIONS.PAGE_ADMIN_PERMISSIONS);
    }

    // For user role, get from user_role_permissions table or default
    if (args.role === "user") {
      const userRoleConfig = await ctx.db
        .query("user_role_permissions")
        .withIndex("by_role", (q) => q.eq("role", "user"))
        .first();
      
      return userRoleConfig ? userRoleConfig.permissions : ROLE_PERMISSIONS[args.role];
    }

    return ROLE_PERMISSIONS[args.role];
  },
});

/**
 * Update permissions for all users with a specific role
 */
export const updatePermissionsForRole = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("support"), v.literal("user")),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Get admin record to check role
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      throw new ConvexError("Not an admin");
    }

    // Super admin can manage permissions, others need specific permission
    if (admin.role !== "super_admin") {
      await requireAdminPermission(ctx, identity.subject, PERMISSIONS.MANAGE_USER_ROLES);
    }

    // Validate permissions - ensure all provided permissions exist
    const validPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = args.permissions.filter(p => !validPermissions.includes(p as any));
    if (invalidPermissions.length > 0) {
      throw new ConvexError(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Note: super_admin role is not included in the union type, so this check is not needed
    // but keeping it for extra safety
    if ((args.role as string) === "super_admin") {
      throw new ConvexError("Cannot modify super_admin permissions");
    }

    if (args.role === "user") {
      // For user role, we need to update the role template and all users
      // First, check if a user role permissions record exists, if not create one
      let userRoleConfig = await ctx.db
        .query("user_role_permissions")
        .first();
      
      if (!userRoleConfig) {
        await ctx.db.insert("user_role_permissions", {
          role: "user",
          permissions: args.permissions,
          updatedAt: Date.now(),
          updatedBy: identity.subject,
        });
      } else {
        await ctx.db.patch(userRoleConfig._id, {
          permissions: args.permissions,
          updatedAt: Date.now(),
          updatedBy: identity.subject,
        });
      }

      // Count of users affected (for logging)
      const allUsers = await ctx.db.query("users").collect();
      const regularUsers = allUsers.filter(user => 
        !user.role || user.role === "user"
      );

      // Log the action
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "update_role_permissions",
        target: "role",
        targetId: args.role,
        details: {
          updatedPermissions: args.permissions,
          affectedUsers: regularUsers.length,
        },
        timestamp: Date.now(),
      });

      return { 
        success: true, 
        updatedCount: regularUsers.length,
        role: args.role,
        permissions: args.permissions
      };
    } else {
      // For admin/support roles, update admin records
      const adminRole = args.role as "admin" | "support";
      const adminsToUpdate = await ctx.db
        .query("admins")
        .withIndex("by_role", (q) => q.eq("role", adminRole))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Update permissions for all users with this role
      for (const admin of adminsToUpdate) {
        await ctx.db.patch(admin._id, { 
          permissions: args.permissions 
        });
      }

      // Log the action
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "update_role_permissions",
        target: "role",
        targetId: args.role,
        details: {
          updatedPermissions: args.permissions,
          affectedUsers: adminsToUpdate.length,
        },
        timestamp: Date.now(),
      });

      return { 
        success: true, 
        updatedCount: adminsToUpdate.length,
        role: args.role,
        permissions: args.permissions
      };
    }
  },
});

/**
 * Get all available permissions grouped by category
 */
export const getAvailablePermissions = query({
  args: {},
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Get admin record to check role
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      throw new ConvexError("Not an admin");
    }

    // Super admin can view permissions management, others need specific permission
    if (admin.role !== "super_admin") {
      await requireAdminPermission(ctx, identity.subject, PERMISSIONS.PAGE_ADMIN_PERMISSIONS);
    }

    // Group permissions by category
    const permissionGroups = {
      pageAccess: {
        label: "Page Access Permissions",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => key.startsWith('PAGE_'))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace('PAGE_ADMIN_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      userDashboard: {
        label: "User Dashboard",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['ACCESS_DASHBOARD', 'ACCESS_CHAT', 'ACCESS_USER_SETTINGS', 'EDIT_PROFILE', 'CHANGE_PASSWORD'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/ACCESS_|EDIT_|CHANGE_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      userContent: {
        label: "User Content",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['CREATE_CONTENT', 'EDIT_OWN_CONTENT', 'DELETE_OWN_CONTENT', 'SHARE_CONTENT'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/CREATE_|EDIT_OWN_|DELETE_OWN_|SHARE_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      userSubscriptions: {
        label: "User Subscriptions",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['VIEW_OWN_SUBSCRIPTION', 'MANAGE_OWN_SUBSCRIPTION', 'CANCEL_OWN_SUBSCRIPTION'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/VIEW_OWN_|MANAGE_OWN_|CANCEL_OWN_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      userApi: {
        label: "User API & Data",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['USE_API', 'EXPORT_OWN_DATA'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/USE_|EXPORT_OWN_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      userManagement: {
        label: "User Management",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['VIEW_USERS', 'EDIT_USERS', 'DELETE_USERS', 'MANAGE_USER_ROLES'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      subscriptions: {
        label: "Subscription Management",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => key.includes('SUBSCRIPTION') && !key.includes('OWN'))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      products: {
        label: "Product Management",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => key.includes('PRODUCT'))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      analytics: {
        label: "Analytics & Reporting",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['VIEW_ANALYTICS', 'EXPORT_DATA'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      system: {
        label: "System Administration",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['MANAGE_ADMINS', 'VIEW_AUDIT_LOGS', 'SYSTEM_SETTINGS'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      },
      support: {
        label: "Support Functions",
        permissions: Object.entries(PERMISSIONS)
          .filter(([key]) => ['CUSTOMER_SUPPORT', 'VIEW_USER_SESSIONS'].includes(key))
          .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          }))
      }
    };

    return permissionGroups;
  },
});

/**
 * Log admin action for audit trail
 */
export const logAdminAction = mutation({
  args: {
    adminId: v.string(),
    action: v.string(),
    target: v.string(),
    targetId: v.string(),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get audit logs with pagination
 */
export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    adminId: v.optional(v.string()),
    target: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query;

    // Apply filters
    if (args.adminId) {
      query = ctx.db.query("audit_logs").withIndex("by_admin", (q: any) => q.eq("adminId", args.adminId));
    } else if (args.target) {
      query = ctx.db.query("audit_logs").withIndex("by_target", (q: any) => q.eq("target", args.target));
    } else {
      query = ctx.db.query("audit_logs");
    }

    // Apply date range filter
    if (args.startDate || args.endDate) {
      query = query.filter((q) => {
        let condition = q.gte(q.field("timestamp"), args.startDate || 0);
        if (args.endDate) {
          condition = q.and(condition, q.lte(q.field("timestamp"), args.endDate));
        }
        return condition;
      });
    }

    // Order by timestamp descending and limit
    const logs = await query
      .order("desc")
      .take(args.limit || 50);

    // Get admin details for each log
    const logsWithAdmins = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db
          .query("admins")
          .withIndex("by_user", (q) => q.eq("userId", log.adminId))
          .first();
        
        const user = admin ? await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("tokenIdentifier"), admin.userId))
          .first() : null;

        return {
          ...log,
          admin: admin ? { ...admin, user } : null,
        };
      })
    );

    return logsWithAdmins;
  },
});