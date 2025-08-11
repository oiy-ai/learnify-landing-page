import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { requireAdminPermission, PERMISSIONS } from "./permissions";

// Enhanced permission constants for fine-grained control
export const ENHANCED_PERMISSIONS = {
  // User management - fine-grained
  VIEW_USER_DETAILS: "view_user_details",
  VIEW_USER_SESSIONS: "view_user_sessions",
  VIEW_USER_ACTIVITY: "view_user_activity",
  EDIT_USER_PROFILE: "edit_user_profile",
  EDIT_USER_ROLES: "edit_user_roles",
  SUSPEND_USERS: "suspend_users",
  DELETE_USERS: "delete_users",
  EXPORT_USER_DATA: "export_user_data",
  
  // Subscription management - fine-grained
  VIEW_SUBSCRIPTION_DETAILS: "view_subscription_details",
  VIEW_PAYMENT_HISTORY: "view_payment_history",
  MODIFY_SUBSCRIPTIONS: "modify_subscriptions",
  CANCEL_SUBSCRIPTIONS: "cancel_subscriptions",
  REFUND_PAYMENTS: "refund_payments",
  VIEW_REVENUE_DATA: "view_revenue_data",
  EXPORT_FINANCIAL_DATA: "export_financial_data",
  
  // Product management - fine-grained
  VIEW_PRODUCT_ANALYTICS: "view_product_analytics",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCT_DETAILS: "edit_product_details",
  EDIT_PRODUCT_PRICING: "edit_product_pricing",
  PUBLISH_PRODUCTS: "publish_products",
  DELETE_PRODUCTS: "delete_products",
  MANAGE_PRODUCT_CATEGORIES: "manage_product_categories",
  
  // System administration - fine-grained
  VIEW_SYSTEM_LOGS: "view_system_logs",
  EXPORT_SYSTEM_LOGS: "export_system_logs",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  MANAGE_SECURITY_SETTINGS: "manage_security_settings",
  CREATE_BACKUPS: "create_backups",
  RESTORE_BACKUPS: "restore_backups",
  MANAGE_ADMIN_ACCOUNTS: "manage_admin_accounts",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  EXPORT_AUDIT_LOGS: "export_audit_logs",
  
  // Security operations
  MANAGE_IP_WHITELIST: "manage_ip_whitelist",
  MANAGE_2FA_SETTINGS: "manage_2fa_settings",
  VIEW_SECURITY_ALERTS: "view_security_alerts",
  MANAGE_SESSION_POLICIES: "manage_session_policies",
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    ENHANCED_PERMISSIONS.VIEW_USER_DETAILS,
    ENHANCED_PERMISSIONS.VIEW_USER_SESSIONS,
    ENHANCED_PERMISSIONS.VIEW_USER_ACTIVITY,
    ENHANCED_PERMISSIONS.EDIT_USER_PROFILE,
    ENHANCED_PERMISSIONS.EDIT_USER_ROLES,
    ENHANCED_PERMISSIONS.SUSPEND_USERS,
    ENHANCED_PERMISSIONS.EXPORT_USER_DATA,
  ],
  SUBSCRIPTION_MANAGEMENT: [
    ENHANCED_PERMISSIONS.VIEW_SUBSCRIPTION_DETAILS,
    ENHANCED_PERMISSIONS.VIEW_PAYMENT_HISTORY,
    ENHANCED_PERMISSIONS.MODIFY_SUBSCRIPTIONS,
    ENHANCED_PERMISSIONS.CANCEL_SUBSCRIPTIONS,
    ENHANCED_PERMISSIONS.VIEW_REVENUE_DATA,
    ENHANCED_PERMISSIONS.EXPORT_FINANCIAL_DATA,
  ],
  PRODUCT_MANAGEMENT: [
    ENHANCED_PERMISSIONS.VIEW_PRODUCT_ANALYTICS,
    ENHANCED_PERMISSIONS.CREATE_PRODUCTS,
    ENHANCED_PERMISSIONS.EDIT_PRODUCT_DETAILS,
    ENHANCED_PERMISSIONS.EDIT_PRODUCT_PRICING,
    ENHANCED_PERMISSIONS.PUBLISH_PRODUCTS,
    ENHANCED_PERMISSIONS.DELETE_PRODUCTS,
    ENHANCED_PERMISSIONS.MANAGE_PRODUCT_CATEGORIES,
  ],
  SYSTEM_ADMINISTRATION: [
    ENHANCED_PERMISSIONS.VIEW_SYSTEM_LOGS,
    ENHANCED_PERMISSIONS.EXPORT_SYSTEM_LOGS,
    ENHANCED_PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    ENHANCED_PERMISSIONS.MANAGE_SECURITY_SETTINGS,
    ENHANCED_PERMISSIONS.CREATE_BACKUPS,
    ENHANCED_PERMISSIONS.RESTORE_BACKUPS,
    ENHANCED_PERMISSIONS.MANAGE_ADMIN_ACCOUNTS,
    ENHANCED_PERMISSIONS.VIEW_AUDIT_LOGS,
    ENHANCED_PERMISSIONS.EXPORT_AUDIT_LOGS,
  ],
  SECURITY_OPERATIONS: [
    ENHANCED_PERMISSIONS.MANAGE_IP_WHITELIST,
    ENHANCED_PERMISSIONS.MANAGE_2FA_SETTINGS,
    ENHANCED_PERMISSIONS.VIEW_SECURITY_ALERTS,
    ENHANCED_PERMISSIONS.MANAGE_SESSION_POLICIES,
  ],
} as const;

// Enhanced role definitions with fine-grained permissions
export const ENHANCED_ROLE_PERMISSIONS = {
  super_admin: Object.values(ENHANCED_PERMISSIONS),
  admin: [
    ...PERMISSION_GROUPS.USER_MANAGEMENT,
    ...PERMISSION_GROUPS.SUBSCRIPTION_MANAGEMENT,
    ...PERMISSION_GROUPS.PRODUCT_MANAGEMENT,
    ENHANCED_PERMISSIONS.VIEW_SYSTEM_LOGS,
    ENHANCED_PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    ENHANCED_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  manager: [
    ENHANCED_PERMISSIONS.VIEW_USER_DETAILS,
    ENHANCED_PERMISSIONS.VIEW_USER_ACTIVITY,
    ENHANCED_PERMISSIONS.EDIT_USER_PROFILE,
    ...PERMISSION_GROUPS.SUBSCRIPTION_MANAGEMENT,
    ...PERMISSION_GROUPS.PRODUCT_MANAGEMENT.filter(p => 
      p !== ENHANCED_PERMISSIONS.DELETE_PRODUCTS
    ),
    ENHANCED_PERMISSIONS.VIEW_SYSTEM_LOGS,
    ENHANCED_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  support: [
    ENHANCED_PERMISSIONS.VIEW_USER_DETAILS,
    ENHANCED_PERMISSIONS.VIEW_USER_SESSIONS,
    ENHANCED_PERMISSIONS.VIEW_USER_ACTIVITY,
    ENHANCED_PERMISSIONS.EDIT_USER_PROFILE,
    ENHANCED_PERMISSIONS.VIEW_SUBSCRIPTION_DETAILS,
    ENHANCED_PERMISSIONS.VIEW_PAYMENT_HISTORY,
    ENHANCED_PERMISSIONS.VIEW_PRODUCT_ANALYTICS,
  ],
} as const;

/**
 * Check if a user has a specific enhanced permission
 */
export const checkEnhancedPermission = query({
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

    // Check if admin has specific permission or if it's in their role permissions
    const hasDirectPermission = admin.permissions.includes(args.permission);
    const rolePermissions = ENHANCED_ROLE_PERMISSIONS[admin.role as keyof typeof ENHANCED_ROLE_PERMISSIONS] || [];
    const hasRolePermission = rolePermissions.includes(args.permission as any);

    return hasDirectPermission || hasRolePermission;
  },
});

/**
 * Get all permissions for a user (combining direct and role-based)
 */
export const getUserPermissions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!admin) {
      return [];
    }

    // Combine direct permissions with role-based permissions
    const rolePermissions = ENHANCED_ROLE_PERMISSIONS[admin.role as keyof typeof ENHANCED_ROLE_PERMISSIONS] || [];
    const allPermissions = [...new Set([...admin.permissions, ...rolePermissions])];

    return allPermissions;
  },
});

/**
 * Update user permissions (add or remove specific permissions)
 */
export const updateUserPermissions = mutation({
  args: {
    adminId: v.string(),
    targetUserId: v.string(),
    permissions: v.array(v.string()),
    action: v.union(v.literal("add"), v.literal("remove"), v.literal("set")),
  },
  handler: async (ctx, args) => {
    // Check if the admin has permission to manage admin accounts
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.MANAGE_ADMINS);

    const targetAdmin = await ctx.db
      .query("admins")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!targetAdmin) {
      throw new ConvexError("Target user is not an admin");
    }

    let newPermissions: string[];

    switch (args.action) {
      case "add":
        newPermissions = [...new Set([...targetAdmin.permissions, ...args.permissions])];
        break;
      case "remove":
        newPermissions = targetAdmin.permissions.filter(p => !args.permissions.includes(p));
        break;
      case "set":
        newPermissions = args.permissions;
        break;
    }

    // Update the admin record
    await ctx.db.patch(targetAdmin._id, {
      permissions: newPermissions,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: `${args.action.toUpperCase()}_PERMISSIONS`,
      target: "admin_permissions",
      targetId: args.targetUserId,
      details: {
        action: args.action,
        permissions: args.permissions,
        newPermissions,
      },
    });

    return { success: true, newPermissions };
  },
});

/**
 * Get permission groups and their descriptions
 */
export const getPermissionGroups = query({
  args: {},
  handler: async (ctx) => {
    return Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => ({
      name: groupName,
      displayName: groupName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      permissions: permissions.map(permission => ({
        key: permission,
        displayName: permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      })),
    }));
  },
});

/**
 * Middleware function for enhanced permission checking
 */
export async function requireEnhancedPermission(
  ctx: any,
  userId: string,
  permission: string
) {
  const hasPermission = await ctx.runQuery(api.security.checkEnhancedPermission, {
    userId,
    permission
  });

  if (!hasPermission) {
    throw new ConvexError(`Access denied: Missing enhanced permission '${permission}'`);
  }

  return true;
}