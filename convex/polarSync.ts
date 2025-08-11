import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdminPermission, PERMISSIONS } from "./permissions";

// Polar API配置
const POLAR_API_BASE = "https://api.polar.sh/v1";
const DEFAULT_PAGE_SIZE = 50; // 保守的分页大小，避免超出rate limit
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1秒

interface PolarSubscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  started_at: string;
  ended_at?: string;
  canceled_at?: string;
  customer_id: string;
  price_id: string;
  currency: string;
  amount: number;
  recurring_interval: string;
  customer?: {
    id: string;
    email?: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

interface PolarCustomer {
  id: string;
  email?: string;
  name?: string;
  created_at: string;
  modified_at?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  subscriptionsProcessed: number;
  customersProcessed: number;
  errors: string[];
  skipped: number;
  created: number;
  updated: number;
}

// 延迟函数用于处理rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 重试机制的API调用
async function fetchWithRetry(url: string, options: RequestInit, attempts = RETRY_ATTEMPTS): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // 如果遇到rate limit，等待并重试
    if (response.status === 429) {
      if (attempts > 1) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY;
        await delay(waitTime);
        return fetchWithRetry(url, options, attempts - 1);
      }
    }
    
    return response;
  } catch (error) {
    if (attempts > 1) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, attempts - 1);
    }
    throw error;
  }
}

// 从Polar获取订阅数据（支持分页）
async function fetchPolarSubscriptions(
  organizationId: string, 
  accessToken: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE
): Promise<{ items: PolarSubscription[], hasMore: boolean }> {
  const url = `${POLAR_API_BASE}/subscriptions?organization_id=${organizationId}&page=${page}&limit=${limit}`;
  
  const response = await fetchWithRetry(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch subscriptions: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    hasMore: data.pagination?.total_count > page * limit
  };
}

// 从Polar获取客户数据
async function fetchPolarCustomers(
  organizationId: string,
  accessToken: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE
): Promise<{ items: PolarCustomer[], hasMore: boolean }> {
  const url = `${POLAR_API_BASE}/customers?organization_id=${organizationId}&page=${page}&limit=${limit}`;
  
  const response = await fetchWithRetry(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch customers: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    hasMore: data.pagination?.total_count > page * limit
  };
}

// 查找特定polarId的订阅
export const findSubscriptionByPolarId = query({
  args: {
    polarId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("polarId", (q) => q.eq("polarId", args.polarId))
      .first();
  },
});

// 将Polar订阅数据转换为本地格式
function convertPolarSubscription(polarSub: PolarSubscription, adminId: string) {
  return {
    polarId: polarSub.id,
    polarPriceId: polarSub.price_id,
    currency: polarSub.currency,
    interval: polarSub.recurring_interval,
    status: polarSub.status,
    currentPeriodStart: new Date(polarSub.current_period_start).getTime(),
    currentPeriodEnd: new Date(polarSub.current_period_end).getTime(),
    cancelAtPeriodEnd: polarSub.cancel_at_period_end,
    amount: polarSub.amount,
    startedAt: new Date(polarSub.started_at).getTime(),
    endedAt: polarSub.ended_at ? new Date(polarSub.ended_at).getTime() : undefined,
    canceledAt: polarSub.canceled_at ? new Date(polarSub.canceled_at).getTime() : undefined,
    customerEmail: polarSub.customer?.email,
    metadata: polarSub.metadata || {},
    customFieldData: {},
    customerId: polarSub.customer_id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // 这里需要映射到系统中的userId，如果没有则先设为undefined
    userId: polarSub.metadata?.userId || undefined,
  };
}

// 将订阅数据插入数据库的mutation
export const insertSubscriptionMutation = mutation({
  args: {
    subscriptionData: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", args.subscriptionData);
  },
});

// 更新订阅数据的mutation
export const updateSubscriptionMutation = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    updateData: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.subscriptionId, args.updateData);
  },
});

// 插入审计日志的mutation
export const insertAuditLogMutation = mutation({
  args: {
    logData: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audit_logs", args.logData);
  },
});

// 主要的同步函数 - 改为action
export const syncPolarData = action({
  args: {
    adminId: v.string(),
    syncType: v.union(v.literal("subscriptions"), v.literal("customers"), v.literal("all")),
    forceUpdate: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SyncResult> => {
    // 在action中验证管理员权限
    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: args.adminId,
      permission: PERMISSIONS.VIEW_SUBSCRIPTIONS
    });
    
    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const result: SyncResult = {
      success: false,
      message: "",
      subscriptionsProcessed: 0,
      customersProcessed: 0,
      errors: [],
      skipped: 0,
      created: 0,
      updated: 0,
    };

    const startTime = Date.now();

    try {
      // 获取Polar配置
      const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
      const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

      if (!polarAccessToken || !polarOrgId) {
        throw new Error("Polar.sh API credentials not configured");
      }

      // 记录同步开始
      await ctx.runMutation(api.polarSync.insertAuditLogMutation, {
        logData: {
          adminId: args.adminId,
          action: "POLAR_SYNC_START",
          target: "polar_integration",
          targetId: `sync_${args.syncType}`,
          details: {
            syncType: args.syncType,
            forceUpdate: args.forceUpdate || false,
          },
          timestamp: startTime,
        }
      });

      // 同步订阅数据
      if (args.syncType === "subscriptions" || args.syncType === "all") {
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const subscriptionsData = await fetchPolarSubscriptions(
              polarOrgId, 
              polarAccessToken, 
              page
            );

            for (const polarSub of subscriptionsData.items) {
              try {
                // 查找现有订阅
                const existingSubscription = await ctx.runQuery(api.polarSync.findSubscriptionByPolarId, { 
                  polarId: polarSub.id
                });
                
                const subscriptionData = convertPolarSubscription(polarSub, args.adminId);

                if (existingSubscription) {
                  if (args.forceUpdate) {
                    // 更新现有订阅
                    await ctx.runMutation(api.polarSync.updateSubscriptionMutation, {
                      subscriptionId: existingSubscription._id,
                      updateData: {
                        ...subscriptionData,
                        updatedAt: Date.now(),
                      }
                    });
                    result.updated++;
                  } else {
                    result.skipped++;
                  }
                } else {
                  // 创建新订阅
                  await ctx.runMutation(api.polarSync.insertSubscriptionMutation, {
                    subscriptionData
                  });
                  result.created++;
                }

                result.subscriptionsProcessed++;
              } catch (error) {
                const errorMsg = `Failed to process subscription ${polarSub.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
              }
            }

            hasMore = subscriptionsData.hasMore;
            page++;
            
            // 添加小延迟避免rate limiting
            if (hasMore) {
              await delay(100);
            }
          } catch (error) {
            const errorMsg = `Failed to fetch subscriptions page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            result.errors.push(errorMsg);
            break;
          }
        }
      }

      // 成功完成同步
      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Sync completed: created ${result.created} subscriptions, updated ${result.updated} subscriptions, skipped ${result.skipped} subscriptions`
        : `Sync completed with errors: created ${result.created} subscriptions, updated ${result.updated} subscriptions, ${result.errors.length} errors`;

      // 记录同步结果
      await ctx.runMutation(api.polarSync.insertAuditLogMutation, {
        logData: {
          adminId: args.adminId,
          action: result.success ? "POLAR_SYNC_SUCCESS" : "POLAR_SYNC_PARTIAL",
          target: "polar_integration",
          targetId: `sync_${args.syncType}`,
          details: {
            duration: Date.now() - startTime,
            ...result,
          },
          timestamp: Date.now(),
        }
      });

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      result.errors.push(errorMsg);
      result.message = `Sync failed: ${errorMsg}`;

      // 记录同步失败
      await ctx.runMutation(api.polarSync.insertAuditLogMutation, {
        logData: {
          adminId: args.adminId,
          action: "POLAR_SYNC_FAILED",
          target: "polar_integration",
          targetId: `sync_${args.syncType}`,
          details: {
            error: errorMsg,
            duration: Date.now() - startTime,
          },
          timestamp: Date.now(),
        }
      });

      return result;
    }
  },
});

// 获取同步状态
export const getSyncStatus = query({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    // 验证管理员权限
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_SUBSCRIPTIONS);

    // 获取最近的同步记录
    const recentSyncs = await ctx.db
      .query("audit_logs")
      .withIndex("by_target", (q) => q.eq("target", "polar_integration"))
      .filter((q) => q.eq(q.field("adminId"), args.adminId))
      .order("desc")
      .take(5);

    // 获取当前订阅统计
    const totalSubscriptions = await ctx.db.query("subscriptions").collect();
    const activeSubscriptions = totalSubscriptions.filter(sub => sub.status === "active");

    return {
      totalSubscriptions: totalSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      recentSyncs: recentSyncs.map(sync => ({
        action: sync.action,
        timestamp: sync.timestamp,
        details: sync.details,
      })),
      lastSyncTime: recentSyncs.length > 0 ? recentSyncs[0].timestamp : null,
    };
  },
});

// 获取Polar连接状态
export const checkPolarConnection = query({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    // 验证管理员权限
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_SUBSCRIPTIONS);

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    return {
      hasCredentials: Boolean(polarAccessToken && polarOrgId),
      organizationId: polarOrgId ? polarOrgId.slice(0, 8) + "..." : null,
      tokenConfigured: Boolean(polarAccessToken),
    };
  },
});