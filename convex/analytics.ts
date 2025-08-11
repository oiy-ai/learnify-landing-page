import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdminPermission, PERMISSIONS } from "./permissions";

/**
 * Get comprehensive KPI metrics for admin dashboard
 */
export const getKPIMetrics = query({
  args: {
    adminId: v.string(),
    timeframe: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    // Calculate time range
    const now = Date.now();
    const timeframes = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const timeframe = args.timeframe || "30d";
    const startTime = now - timeframes[timeframe];
    const previousStartTime = startTime - timeframes[timeframe];

    // Get all data
    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();
    const products = await ctx.db.query("products").collect();

    // Current period data
    const currentUsers = users.filter(u => (u.createdAt || 0) > startTime);
    const currentSubscriptions = subscriptions.filter(s => (s.createdAt || 0) > startTime);
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    const cancelledSubscriptions = subscriptions.filter(s => 
      s.status === "cancelled" && (s.updatedAt || 0) > startTime
    );

    // Previous period data for comparison
    const previousUsers = users.filter(u => 
      (u.createdAt || 0) > previousStartTime && (u.createdAt || 0) <= startTime
    );
    const previousSubscriptions = subscriptions.filter(s => 
      (s.createdAt || 0) > previousStartTime && (s.createdAt || 0) <= startTime
    );

    // Revenue calculations
    const currentRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.amount || 0);
    }, 0);

    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.interval === "month") {
        return sum + (sub.amount || 0);
      } else if (sub.interval === "year") {
        return sum + ((sub.amount || 0) / 12);
      }
      return sum;
    }, 0);

    // Growth calculations
    const userGrowth = previousUsers.length > 0 
      ? ((currentUsers.length - previousUsers.length) / previousUsers.length) * 100 
      : 0;

    const subscriptionGrowth = previousSubscriptions.length > 0
      ? ((currentSubscriptions.length - previousSubscriptions.length) / previousSubscriptions.length) * 100
      : 0;

    // Conversion rate
    const totalUsers = users.length;
    const totalActiveSubscriptions = activeSubscriptions.length;
    const conversionRate = totalUsers > 0 ? (totalActiveSubscriptions / totalUsers) * 100 : 0;

    // Churn rate
    const churnRate = activeSubscriptions.length > 0 
      ? (cancelledSubscriptions.length / (activeSubscriptions.length + cancelledSubscriptions.length)) * 100 
      : 0;

    return {
      timeframe,
      metrics: {
        totalUsers: users.length,
        newUsers: currentUsers.length,
        userGrowth: Math.round(userGrowth * 100) / 100,
        
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        newSubscriptions: currentSubscriptions.length,
        subscriptionGrowth: Math.round(subscriptionGrowth * 100) / 100,
        
        totalRevenue: currentRevenue,
        monthlyRecurringRevenue: monthlyRevenue,
        
        conversionRate: Math.round(conversionRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
      },
      trends: {
        userGrowthTrend: userGrowth > 0 ? "up" : userGrowth < 0 ? "down" : "stable",
        subscriptionGrowthTrend: subscriptionGrowth > 0 ? "up" : subscriptionGrowth < 0 ? "down" : "stable",
        revenueTrend: "up", // Simplified - would need historical data for accurate calculation
      }
    };
  },
});

/**
 * Get user growth data for charts
 */
export const getUserGrowthData = query({
  args: {
    adminId: v.string(),
    timeframe: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const timeframe = args.timeframe || "30d";
    const now = Date.now();
    const timeframes = {
      "7d": { period: 7 * 24 * 60 * 60 * 1000, intervals: 7, unit: "day" },
      "30d": { period: 30 * 24 * 60 * 60 * 1000, intervals: 30, unit: "day" },
      "90d": { period: 90 * 24 * 60 * 60 * 1000, intervals: 12, unit: "week" },
      "1y": { period: 365 * 24 * 60 * 60 * 1000, intervals: 12, unit: "month" },
    };

    const config = timeframes[timeframe];
    const startTime = now - config.period;
    const intervalSize = config.period / config.intervals;

    const users = await ctx.db.query("users").collect();
    const relevantUsers = users.filter(u => (u.createdAt || 0) > startTime);

    // Group users by time intervals
    const growthData = [];
    for (let i = 0; i < config.intervals; i++) {
      const intervalStart = startTime + (i * intervalSize);
      const intervalEnd = intervalStart + intervalSize;
      
      const usersInInterval = relevantUsers.filter(u => 
        (u.createdAt || 0) >= intervalStart && (u.createdAt || 0) < intervalEnd
      );

      const date = new Date(intervalStart);
      let label = "";
      
      if (config.unit === "day") {
        label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (config.unit === "week") {
        label = `Week ${Math.floor(i / 7) + 1}`;
      } else if (config.unit === "month") {
        label = date.toLocaleDateString("en-US", { month: "short" });
      }

      growthData.push({
        period: label,
        users: usersInInterval.length,
        cumulative: relevantUsers.filter(u => (u.createdAt || 0) <= intervalEnd).length,
        timestamp: intervalStart,
      });
    }

    return {
      timeframe,
      data: growthData,
      total: relevantUsers.length,
    };
  },
});

/**
 * Get revenue analytics data
 */
export const getRevenueAnalytics = query({
  args: {
    adminId: v.string(),
    timeframe: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const timeframe = args.timeframe || "30d";
    const now = Date.now();
    const timeframes = {
      "7d": { period: 7 * 24 * 60 * 60 * 1000, intervals: 7, unit: "day" },
      "30d": { period: 30 * 24 * 60 * 60 * 1000, intervals: 30, unit: "day" },
      "90d": { period: 90 * 24 * 60 * 60 * 1000, intervals: 12, unit: "week" },
      "1y": { period: 365 * 24 * 60 * 60 * 1000, intervals: 12, unit: "month" },
    };

    const config = timeframes[timeframe];
    const startTime = now - config.period;
    const intervalSize = config.period / config.intervals;

    const subscriptions = await ctx.db.query("subscriptions").collect();
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");

    // Group revenue by time intervals
    const revenueData = [];
    for (let i = 0; i < config.intervals; i++) {
      const intervalStart = startTime + (i * intervalSize);
      const intervalEnd = intervalStart + intervalSize;
      
      const subscriptionsInInterval = subscriptions.filter(s => 
        (s.createdAt || 0) >= intervalStart && (s.createdAt || 0) < intervalEnd
      );

      const revenue = subscriptionsInInterval.reduce((sum, sub) => {
        return sum + (sub.amount || 0);
      }, 0);

      const date = new Date(intervalStart);
      let label = "";
      
      if (config.unit === "day") {
        label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (config.unit === "week") {
        label = `Week ${Math.floor(i / 7) + 1}`;
      } else if (config.unit === "month") {
        label = date.toLocaleDateString("en-US", { month: "short" });
      }

      revenueData.push({
        period: label,
        revenue: revenue / 100, // Convert cents to dollars
        subscriptions: subscriptionsInInterval.length,
        timestamp: intervalStart,
      });
    }

    // Calculate totals
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.interval === "month") {
        return sum + (sub.amount || 0);
      } else if (sub.interval === "year") {
        return sum + ((sub.amount || 0) / 12);
      }
      return sum;
    }, 0);

    return {
      timeframe,
      data: revenueData,
      totals: {
        totalRevenue: totalRevenue / 100,
        monthlyRecurringRevenue: monthlyRevenue / 100,
        activeSubscriptions: activeSubscriptions.length,
      },
    };
  },
});

/**
 * Get conversion funnel data
 */
export const getConversionMetrics = query({
  args: {
    adminId: v.string(),
    timeframe: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const timeframe = args.timeframe || "30d";
    const now = Date.now();
    const timeframes = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - timeframes[timeframe];

    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();

    // Filter by timeframe
    const recentUsers = users.filter(u => (u.createdAt || 0) > startTime);
    const recentSubscriptions = subscriptions.filter(s => (s.createdAt || 0) > startTime);

    // Calculate funnel metrics
    const totalVisitors = recentUsers.length; // Simplified - would need actual visitor tracking
    const signups = recentUsers.length;
    const trialUsers = recentUsers.length; // Simplified - would need trial tracking
    const paidUsers = recentSubscriptions.filter(s => s.status === "active").length;

    const signupRate = totalVisitors > 0 ? (signups / totalVisitors) * 100 : 0;
    const trialConversionRate = signups > 0 ? (trialUsers / signups) * 100 : 0;
    const paidConversionRate = trialUsers > 0 ? (paidUsers / trialUsers) * 100 : 0;
    const overallConversionRate = totalVisitors > 0 ? (paidUsers / totalVisitors) * 100 : 0;

    return {
      timeframe,
      funnel: [
        {
          stage: "Visitors",
          count: totalVisitors,
          rate: 100,
          description: "Total website visitors",
        },
        {
          stage: "Signups",
          count: signups,
          rate: Math.round(signupRate * 100) / 100,
          description: "Users who created accounts",
        },
        {
          stage: "Trial Users",
          count: trialUsers,
          rate: Math.round(trialConversionRate * 100) / 100,
          description: "Users who started trials",
        },
        {
          stage: "Paid Users",
          count: paidUsers,
          rate: Math.round(paidConversionRate * 100) / 100,
          description: "Users with active subscriptions",
        },
      ],
      metrics: {
        signupRate: Math.round(signupRate * 100) / 100,
        trialConversionRate: Math.round(trialConversionRate * 100) / 100,
        paidConversionRate: Math.round(paidConversionRate * 100) / 100,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      },
    };
  },
});

/**
 * Get retention analysis
 */
export const getRetentionAnalysis = query({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    const subscriptions = await ctx.db.query("subscriptions").collect();
    
    // Calculate retention metrics
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    const cancelledSubscriptions = subscriptions.filter(s => s.status === "cancelled");
    const totalSubscriptions = subscriptions.length;

    // Monthly churn rate
    const now = Date.now();
    const lastMonth = now - (30 * 24 * 60 * 60 * 1000);
    const recentCancellations = cancelledSubscriptions.filter(s => 
      (s.updatedAt || 0) > lastMonth
    );

    const monthlyChurnRate = activeSubscriptions.length > 0 
      ? (recentCancellations.length / (activeSubscriptions.length + recentCancellations.length)) * 100 
      : 0;

    const retentionRate = 100 - monthlyChurnRate;

    // Average subscription duration
    const completedSubscriptions = cancelledSubscriptions.filter(s => 
      s.startedAt && s.canceledAt
    );

    const averageDuration = completedSubscriptions.length > 0
      ? completedSubscriptions.reduce((sum, sub) => {
          const duration = (sub.canceledAt || 0) - (sub.startedAt || 0);
          return sum + duration;
        }, 0) / completedSubscriptions.length
      : 0;

    const averageDurationDays = Math.round(averageDuration / (24 * 60 * 60 * 1000));

    // Cohort analysis (simplified)
    const cohorts = [];
    const monthsBack = 6;
    
    for (let i = 0; i < monthsBack; i++) {
      const cohortStart = now - ((i + 1) * 30 * 24 * 60 * 60 * 1000);
      const cohortEnd = now - (i * 30 * 24 * 60 * 60 * 1000);
      
      const cohortSubscriptions = subscriptions.filter(s => 
        (s.createdAt || 0) >= cohortStart && (s.createdAt || 0) < cohortEnd
      );
      
      const stillActive = cohortSubscriptions.filter(s => s.status === "active").length;
      const cohortRetention = cohortSubscriptions.length > 0 
        ? (stillActive / cohortSubscriptions.length) * 100 
        : 0;

      const cohortDate = new Date(cohortStart);
      cohorts.push({
        month: cohortDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        initialUsers: cohortSubscriptions.length,
        retainedUsers: stillActive,
        retentionRate: Math.round(cohortRetention * 100) / 100,
      });
    }

    return {
      metrics: {
        totalSubscriptions,
        activeSubscriptions: activeSubscriptions.length,
        cancelledSubscriptions: cancelledSubscriptions.length,
        monthlyChurnRate: Math.round(monthlyChurnRate * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100,
        averageDurationDays,
      },
      cohorts: cohorts.reverse(), // Show most recent first
      trends: {
        churnTrend: monthlyChurnRate < 5 ? "good" : monthlyChurnRate < 10 ? "warning" : "critical",
        retentionTrend: retentionRate > 90 ? "excellent" : retentionRate > 80 ? "good" : "needs_improvement",
      },
    };
  },
});