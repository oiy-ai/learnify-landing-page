/**
 * Permission constants for frontend use
 * This mirrors the permissions defined in convex/permissions.ts
 * but is safe to import in browser code
 */
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