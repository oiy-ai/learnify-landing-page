import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Download, 
  Package,
  Target,
  Repeat,
  Activity
} from "lucide-react";
import { api } from "../../../convex/_generated/api";

export default function AdminAnalytics() {
  const { userId } = useAuth();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Queries
  const kpiMetrics = useQuery(
    api.analytics.getKPIMetrics,
    userId ? { adminId: userId, timeframe } : "skip"
  );

  const userGrowthData = useQuery(
    api.analytics.getUserGrowthData,
    userId ? { adminId: userId, timeframe } : "skip"
  );

  const revenueAnalytics = useQuery(
    api.analytics.getRevenueAnalytics,
    userId ? { adminId: userId, timeframe } : "skip"
  );

  const conversionMetrics = useQuery(
    api.analytics.getConversionMetrics,
    userId ? { adminId: userId, timeframe } : "skip"
  );

  const retentionAnalysis = useQuery(
    api.analytics.getRetentionAnalysis,
    userId ? { adminId: userId } : "skip"
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            View insights and generate reports on your business metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {kpiMetrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Growth</CardTitle>
              {getTrendIcon(kpiMetrics.trends.userGrowthTrend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(kpiMetrics.metrics.userGrowth)}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpiMetrics.metrics.newUsers} new users this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Growth</CardTitle>
              {getTrendIcon(kpiMetrics.trends.subscriptionGrowthTrend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(kpiMetrics.metrics.subscriptionGrowth)}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpiMetrics.metrics.newSubscriptions} new subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpiMetrics.metrics.conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {kpiMetrics.metrics.activeSubscriptions} active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(kpiMetrics.metrics.monthlyRecurringRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly Recurring Revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>
                  New user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthData ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Total new users: {userGrowthData.total}
                    </div>
                    <div className="space-y-2">
                      {userGrowthData.data.slice(-7).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.period}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min((item.users / Math.max(...userGrowthData.data.map(d => d.users))) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{item.users}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-8 w-8 mb-2" />
                    <p>Loading user growth data...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Revenue breakdown and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueAnalytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(revenueAnalytics.totals.totalRevenue * 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">MRR</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(revenueAnalytics.totals.monthlyRecurringRevenue * 100)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {revenueAnalytics.data.slice(-7).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.period}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min((item.revenue / Math.max(...revenueAnalytics.data.map(d => d.revenue))) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              ${item.revenue.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-8 w-8 mb-2" />
                    <p>Loading revenue data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          {kpiMetrics && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiMetrics.metrics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpiMetrics.metrics.newUsers} new this period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiMetrics.metrics.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpiMetrics.metrics.newSubscriptions} new this period
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiMetrics.metrics.activeProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    of {kpiMetrics.metrics.totalProducts} total products
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          {conversionMetrics ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    User journey from visitor to paid customer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversionMetrics.funnel.map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {stage.rate}%
                            </span>
                            <span className="font-bold">{stage.count}</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${stage.rate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{stage.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Metrics</CardTitle>
                  <CardDescription>
                    Key conversion rates and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Overall Conversion</p>
                        <p className="text-sm text-muted-foreground">Visitor to paid customer</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{conversionMetrics.metrics.overallConversionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Signup Rate</p>
                        <p className="text-sm text-muted-foreground">Visitor to signup</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{conversionMetrics.metrics.signupRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Trial Conversion</p>
                        <p className="text-sm text-muted-foreground">Signup to trial</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{conversionMetrics.metrics.trialConversionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Paid Conversion</p>
                        <p className="text-sm text-muted-foreground">Trial to paid</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{conversionMetrics.metrics.paidConversionRate}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading conversion data...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          {retentionAnalysis ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Retention Metrics</CardTitle>
                  <CardDescription>
                    Customer retention and churn analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Monthly Churn Rate</p>
                        <p className="text-2xl font-bold text-red-600">
                          {retentionAnalysis.metrics.monthlyChurnRate}%
                        </p>
                        <Badge 
                          variant={retentionAnalysis.trends.churnTrend === "good" ? "default" : "destructive"}
                          className="mt-1"
                        >
                          {retentionAnalysis.trends.churnTrend}
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Retention Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {retentionAnalysis.metrics.retentionRate}%
                        </p>
                        <Badge 
                          variant={retentionAnalysis.trends.retentionTrend === "excellent" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {retentionAnalysis.trends.retentionTrend}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Duration</span>
                        <span className="font-medium">{retentionAnalysis.metrics.averageDurationDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                        <span className="font-medium">{retentionAnalysis.metrics.activeSubscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cancelled Subscriptions</span>
                        <span className="font-medium">{retentionAnalysis.metrics.cancelledSubscriptions}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cohort Analysis</CardTitle>
                  <CardDescription>
                    Retention rates by signup month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {retentionAnalysis.cohorts.map((cohort, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{cohort.month}</p>
                          <p className="text-sm text-muted-foreground">
                            {cohort.initialUsers} initial users
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{cohort.retentionRate}%</p>
                          <p className="text-sm text-muted-foreground">
                            {cohort.retainedUsers} retained
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading retention data...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {revenueAnalytics ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics.totals.totalRevenue * 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics.totals.monthlyRecurringRevenue * 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">Current MRR</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {revenueAnalytics.totals.activeSubscriptions}
                    </div>
                    <p className="text-xs text-muted-foreground">Paying customers</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>
                    Revenue over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueAnalytics.data.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.period}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((item.revenue / Math.max(...revenueAnalytics.data.map(d => d.revenue))) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <span className="font-bold w-20 text-right">
                            ${item.revenue.toFixed(0)}
                          </span>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {item.subscriptions} subs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading revenue data...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}