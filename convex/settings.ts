import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";

// 默认系统设置
const DEFAULT_SETTINGS = {
  // 通用设置
  "system.name": {
    value: "Admin Dashboard",
    category: "general",
    description: "System name displayed in the interface",
    type: "string" as const,
    isPublic: true,
  },
  "system.description": {
    value: "Comprehensive admin management system",
    category: "general", 
    description: "System description",
    type: "string" as const,
    isPublic: true,
  },
  "system.timezone": {
    value: "UTC",
    category: "general",
    description: "Default system timezone",
    type: "string" as const,
    isPublic: false,
  },
  "system.maintenance_mode": {
    value: false,
    category: "general",
    description: "Enable maintenance mode",
    type: "boolean" as const,
    isPublic: false,
  },

  // 用户设置
  "users.auto_approval": {
    value: true,
    category: "users",
    description: "Automatically approve new user registrations",
    type: "boolean" as const,
    isPublic: false,
  },
  "users.email_verification_required": {
    value: true,
    category: "users",
    description: "Require email verification for new users",
    type: "boolean" as const,
    isPublic: false,
  },
  "users.default_role": {
    value: "user",
    category: "users",
    description: "Default role for new users",
    type: "string" as const,
    isPublic: false,
  },
  "users.session_timeout": {
    value: 24,
    category: "users",
    description: "User session timeout in hours",
    type: "number" as const,
    isPublic: false,
  },

  // 通知设置
  "notifications.email_enabled": {
    value: true,
    category: "notifications",
    description: "Enable email notifications",
    type: "boolean" as const,
    isPublic: false,
  },
  "notifications.admin_alerts": {
    value: true,
    category: "notifications",
    description: "Send alerts to administrators",
    type: "boolean" as const,
    isPublic: false,
  },
  "notifications.system_alerts": {
    value: true,
    category: "notifications",
    description: "Enable system alerts",
    type: "boolean" as const,
    isPublic: false,
  },
  "notifications.email_from": {
    value: "noreply@example.com",
    category: "notifications",
    description: "Default email sender address",
    type: "string" as const,
    isPublic: false,
  },

  // 安全设置
  "security.max_login_attempts": {
    value: 5,
    category: "security",
    description: "Maximum login attempts before lockout",
    type: "number" as const,
    isPublic: false,
  },
  "security.lockout_duration": {
    value: 30,
    category: "security",
    description: "Account lockout duration in minutes",
    type: "number" as const,
    isPublic: false,
  },
  "security.password_min_length": {
    value: 8,
    category: "security",
    description: "Minimum password length",
    type: "number" as const,
    isPublic: false,
  },
  "security.require_2fa": {
    value: false,
    category: "security",
    description: "Require two-factor authentication",
    type: "boolean" as const,
    isPublic: false,
  },

  // API设置
  "api.rate_limit": {
    value: 1000,
    category: "api",
    description: "API rate limit per hour",
    type: "number" as const,
    isPublic: false,
  },
  "api.enable_cors": {
    value: true,
    category: "api",
    description: "Enable CORS for API endpoints",
    type: "boolean" as const,
    isPublic: false,
  },
};

// 获取所有设置
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // 检查管理员权限
    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const settings = await ctx.db.query("system_settings").collect();
    
    // 如果没有设置，返回空数组（让前端或其他mutation来初始化）
    return settings;
  },
});

// 按类别获取设置
export const getSettingsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db
      .query("system_settings")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// 获取单个设置
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// 更新设置
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const existing = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    } else {
      // 如果设置不存在，创建新的
      const defaultSetting = DEFAULT_SETTINGS[args.key as keyof typeof DEFAULT_SETTINGS];
      if (!defaultSetting) {
        throw new Error(`Unknown setting key: ${args.key}`);
      }

      await ctx.db.insert("system_settings", {
        key: args.key,
        value: args.value,
        category: defaultSetting.category,
        description: defaultSetting.description,
        type: defaultSetting.type,
        isPublic: defaultSetting.isPublic,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    }

    // 记录审计日志
    await ctx.db.insert("audit_logs", {
      adminId: identity.subject,
      action: "UPDATE_SETTING",
      target: "system_settings",
      targetId: args.key,
      details: {
        key: args.key,
        newValue: args.value,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 批量更新设置
export const updateMultipleSettings = mutation({
  args: {
    settings: v.array(v.object({
      key: v.string(),
      value: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const results = [];
    
    for (const setting of args.settings) {
      const existing = await ctx.db
        .query("system_settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: setting.value,
          updatedAt: Date.now(),
          updatedBy: identity.subject,
        });
      } else {
        const defaultSetting = DEFAULT_SETTINGS[setting.key as keyof typeof DEFAULT_SETTINGS];
        if (defaultSetting) {
          await ctx.db.insert("system_settings", {
            key: setting.key,
            value: setting.value,
            category: defaultSetting.category,
            description: defaultSetting.description,
            type: defaultSetting.type,
            isPublic: defaultSetting.isPublic,
            updatedAt: Date.now(),
            updatedBy: identity.subject,
          });
        }
      }

      results.push({ key: setting.key, success: true });
    }

    // 记录审计日志
    await ctx.db.insert("audit_logs", {
      adminId: identity.subject,
      action: "BULK_UPDATE_SETTINGS",
      target: "system_settings",
      targetId: "multiple",
      details: {
        settingsCount: args.settings.length,
        keys: args.settings.map(s => s.key),
      },
      timestamp: Date.now(),
    });

    return { success: true, results };
  },
});

// 重置设置为默认值
export const resetSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const defaultSetting = DEFAULT_SETTINGS[args.key as keyof typeof DEFAULT_SETTINGS];
    if (!defaultSetting) {
      throw new Error(`Unknown setting key: ${args.key}`);
    }

    const existing = await ctx.db
      .query("system_settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: defaultSetting.value,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    }

    // 记录审计日志
    await ctx.db.insert("audit_logs", {
      adminId: identity.subject,
      action: "RESET_SETTING",
      target: "system_settings",
      targetId: args.key,
      details: {
        key: args.key,
        resetToValue: defaultSetting.value,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// 初始化默认设置 (Mutation)
export const initializeDefaultSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // 检查管理员权限
    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    // 检查是否已经有设置
    const existingSettings = await ctx.db.query("system_settings").collect();
    if (existingSettings.length > 0) {
      return { success: true, message: "Settings already initialized" };
    }

    const now = Date.now();
    
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      await ctx.db.insert("system_settings", {
        key,
        value: config.value,
        category: config.category,
        description: config.description,
        type: config.type,
        isPublic: config.isPublic,
        updatedAt: now,
        updatedBy: identity.subject,
      });
    }

    // 记录审计日志
    await ctx.db.insert("audit_logs", {
      adminId: identity.subject,
      action: "INITIALIZE_DEFAULT_SETTINGS",
      target: "system_settings",
      targetId: "all",
      details: {
        settingsCount: Object.keys(DEFAULT_SETTINGS).length,
      },
      timestamp: now,
    });

    return { success: true, message: "Default settings initialized" };
  },
});

// 获取设置类别列表
export const getSettingsCategories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const categories = Object.values(DEFAULT_SETTINGS).reduce((acc, setting) => {
      if (!acc.includes(setting.category)) {
        acc.push(setting.category);
      }
      return acc;
    }, [] as string[]);

    return categories.map(category => ({
      key: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      description: getCategoryDescription(category),
    }));
  },
});

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    general: "General system configuration and basic settings",
    users: "User management and registration settings",
    notifications: "Email and system notification preferences",
    security: "Security policies and authentication settings",
    api: "API configuration and rate limiting",
  };
  
  return descriptions[category] || "System configuration settings";
}

// 获取系统日志
export const getSystemLogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    level: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    // 从审计日志中获取系统日志
    let query = ctx.db.query("audit_logs");

    // 应用过滤条件
    if (args.startDate || args.endDate) {
      query = query.filter((q) => {
        let condition = q.gte(q.field("timestamp"), args.startDate || 0);
        if (args.endDate) {
          condition = q.and(condition, q.lte(q.field("timestamp"), args.endDate));
        }
        return condition;
      });
    }

    // 按时间倒序排列
    const logs = await query
      .order("desc")
      .take(args.limit || 100);

    // 格式化日志数据
    const formattedLogs = logs.map(log => ({
      id: log._id,
      timestamp: log.timestamp,
      level: getLogLevel(log.action),
      action: log.action,
      adminId: log.adminId,
      target: log.target,
      targetId: log.targetId,
      details: log.details,
      message: getLogMessage(log),
    }));

    return {
      logs: formattedLogs,
      total: formattedLogs.length,
      hasMore: formattedLogs.length === (args.limit || 100),
    };
  },
});

// 辅助函数：根据操作类型确定日志级别
function getLogLevel(action: string): "info" | "warning" | "error" {
  const errorActions = ["DELETE_USER", "DELETE_PRODUCT", "REVOKE_ADMIN"];
  const warningActions = ["UPDATE_USER_STATUS", "CANCEL_SUBSCRIPTION", "RESET_SETTING"];
  
  if (errorActions.includes(action)) return "error";
  if (warningActions.includes(action)) return "warning";
  return "info";
}

// 辅助函数：生成日志消息
function getLogMessage(log: any): string {
  const actionMessages: Record<string, string> = {
    CREATE_USER: "用户账户创建",
    UPDATE_USER: "用户信息更新",
    DELETE_USER: "用户账户删除",
    UPDATE_USER_STATUS: "用户状态更改",
    CREATE_PRODUCT: "产品创建",
    UPDATE_PRODUCT: "产品信息更新",
    DELETE_PRODUCT: "产品删除",
    CANCEL_SUBSCRIPTION: "订阅取消",
    UPDATE_SETTING: "系统设置更新",
    RESET_SETTING: "系统设置重置",
    INITIALIZE_DEFAULT_SETTINGS: "默认设置初始化",
    BULK_UPDATE_SETTINGS: "批量设置更新",
    PROMOTE_USER_TO_ADMIN: "用户提升为管理员",
    REVOKE_ADMIN: "管理员权限撤销",
  };

  const baseMessage = actionMessages[log.action] || log.action;
  return `${baseMessage} - 目标: ${log.target}${log.targetId ? ` (${log.targetId})` : ''}`;
}

// 创建系统备份
export const createBackup = mutation({
  args: {
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const now = Date.now();

    try {
      // 收集所有系统数据
      const users = await ctx.db.query("users").collect();
      const admins = await ctx.db.query("admins").collect();
      const products = await ctx.db.query("products").collect();
      const subscriptions = await ctx.db.query("subscriptions").collect();
      const settings = await ctx.db.query("system_settings").collect();
      const auditLogs = await ctx.db.query("audit_logs")
        .filter((q) => q.gte(q.field("timestamp"), now - 30 * 24 * 60 * 60 * 1000)) // 最近30天
        .collect();
      const userSessions = await ctx.db.query("user_sessions").collect();

      // 创建备份数据结构
      const backupData = {
        version: "1.0",
        timestamp: now,
        description: args.description || "系统自动备份",
        data: {
          users: users.map(user => ({ ...user, _id: undefined, _creationTime: undefined })),
          admins: admins.map(admin => ({ ...admin, _id: undefined, _creationTime: undefined })),
          products: products.map(product => ({ ...product, _id: undefined, _creationTime: undefined })),
          subscriptions: subscriptions.map(sub => ({ ...sub, _id: undefined, _creationTime: undefined })),
          settings: settings.map(setting => ({ ...setting, _id: undefined, _creationTime: undefined })),
          auditLogs: auditLogs.map(log => ({ ...log, _id: undefined, _creationTime: undefined })),
          userSessions: userSessions.map(session => ({ ...session, _id: undefined, _creationTime: undefined })),
        },
        stats: {
          totalUsers: users.length,
          totalAdmins: admins.length,
          totalProducts: products.length,
          totalSubscriptions: subscriptions.length,
          totalSettings: settings.length,
        }
      };

      // 记录审计日志
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "CREATE_BACKUP",
        target: "system",
        targetId: "backup_" + now,
        details: {
          description: args.description,
          dataSize: JSON.stringify(backupData).length,
          tables: Object.keys(backupData.data),
        },
        timestamp: now,
      });

      return {
        success: true,
        backup: {
          id: "backup_" + now,
          timestamp: now,
          description: args.description || "系统自动备份",
          size: JSON.stringify(backupData).length,
          data: backupData,
        }
      };
    } catch (error) {
      // 记录错误日志
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "CREATE_BACKUP_FAILED",
        target: "system",
        targetId: "backup_" + now,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: now,
      });

      throw new Error("备份创建失败: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  },
});

// 从备份恢复（注意：这是一个危险操作，仅用于演示）
export const restoreFromBackup = mutation({
  args: {
    backupData: v.any(),
    confirmCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: identity.subject,
      permission: "system_settings"
    });
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    // 安全确认码检查
    if (args.confirmCode !== "RESTORE_CONFIRM_" + new Date().toISOString().split('T')[0]) {
      throw new Error("Invalid confirmation code");
    }

    const now = Date.now();

    try {
      // 记录恢复开始
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "RESTORE_BACKUP_START",
        target: "system",
        targetId: "restore_" + now,
        details: {
          backupTimestamp: args.backupData.timestamp,
          backupVersion: args.backupData.version,
        },
        timestamp: now,
      });

      // 注意：在实际生产环境中，恢复操作应该更加谨慎
      // 这里只是演示概念，不建议在生产环境中直接使用

      // 恢复系统设置（相对安全的操作）
      if (args.backupData.data.settings) {
        // 清除现有设置
        const existingSettings = await ctx.db.query("system_settings").collect();
        for (const setting of existingSettings) {
          await ctx.db.delete(setting._id);
        }

        // 恢复设置
        for (const setting of args.backupData.data.settings) {
          await ctx.db.insert("system_settings", {
            ...setting,
            updatedAt: now,
            updatedBy: identity.subject,
          });
        }
      }

      // 记录恢复完成
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "RESTORE_BACKUP_COMPLETE",
        target: "system",
        targetId: "restore_" + now,
        details: {
          restoredTables: ["system_settings"],
          backupTimestamp: args.backupData.timestamp,
        },
        timestamp: now,
      });

      return {
        success: true,
        message: "系统设置已从备份中恢复",
        restoredTables: ["system_settings"],
      };
    } catch (error) {
      // 记录恢复失败
      await ctx.db.insert("audit_logs", {
        adminId: identity.subject,
        action: "RESTORE_BACKUP_FAILED",
        target: "system",
        targetId: "restore_" + now,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: now,
      });

      throw new Error("恢复失败: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  },
});