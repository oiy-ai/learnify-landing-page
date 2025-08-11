import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { api } from "../../../../convex/_generated/api";

export function RevenueChart() {
  const { user } = useUser();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const revenueData = useQuery(
    api.subscriptions.getRevenueData,
    user?.id ? {
      adminId: user.id,
      period: period,
    } : "skip"
  );

  const subscriptionAnalytics = useQuery(
    api.subscriptions.getSubscriptionAnalytics,
    user?.id ? { adminId: user.id } : "skip"
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === "7d") {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } else if (period === "1y") {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-green-600">Revenue: </span>
              {formatCurrency(payload[0].value)}
            </p>
            <p className="text-sm">
              <span className="text-blue-600">Subscriptions: </span>
              {payload[1]?.value || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalRevenue = revenueData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalSubscriptions = revenueData?.reduce((sum, item) => sum + item.subscriptions, 0) || 0;
  const averageRevenue = revenueData && revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revenue Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track subscription revenue and growth over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setPeriod(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              For selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              For selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Daily average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>
            {chartType === "line" ? "Line chart" : "Bar chart"} showing revenue and subscription trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "line" ? (
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="revenue"
                    orientation="left"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    yAxisId="subscriptions"
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="subscriptions"
                    type="monotone"
                    dataKey="subscriptions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="revenue"
                    orientation="left"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis 
                    yAxisId="subscriptions"
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No revenue data available for the selected period</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      {subscriptionAnalytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium">
                  {formatCurrency(subscriptionAnalytics.revenueByInterval.monthly)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Yearly Revenue</span>
                <span className="font-medium">
                  {formatCurrency(subscriptionAnalytics.revenueByInterval.yearly)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Active Revenue</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(subscriptionAnalytics.activeRevenue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <span className="font-medium">{subscriptionAnalytics.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New This Period</span>
                <span className="font-medium text-blue-600">{subscriptionAnalytics.newSubscriptions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Churn Rate</span>
                <span className="font-medium text-orange-600">
                  {Math.round(subscriptionAnalytics.churnRate * 100) / 100}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}