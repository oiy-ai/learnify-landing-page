import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { 
  Zap, 
  Database, 
  Activity, 
  TrendingUp, 
  Clock,
  Monitor,
  Settings
} from "lucide-react";
import { PerformanceMonitor } from "~/components/admin/performance/PerformanceMonitor";


export default function AdminPerformance() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
          <p className="text-muted-foreground">
            Monitor and optimize application performance
          </p>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↓ 15%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2MB</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">↑ 5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↓ 8%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.12%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">↓ 2%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Monitor
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            {/* Performance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  System Performance Status
                </CardTitle>
                <CardDescription>
                  Current performance metrics and health indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Frontend Performance</span>
                      <Badge variant="default" className="bg-green-500">Excellent</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">92% performance score</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Backend Performance</span>
                      <Badge variant="default" className="bg-blue-500">Good</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">78% performance score</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Performance</span>
                      <Badge variant="secondary" className="bg-yellow-500">Fair</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">65% performance score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Performance Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance Issues</CardTitle>
                <CardDescription>
                  Identified performance bottlenecks and optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Database className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Slow database queries detected</p>
                        <p className="text-sm text-muted-foreground">
                          User table queries taking &gt;500ms
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Medium Priority</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Large bundle size detected</p>
                        <p className="text-sm text-muted-foreground">
                          Main bundle is 2.1MB, consider code splitting
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Low Priority</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Memory usage optimized</p>
                        <p className="text-sm text-muted-foreground">
                          Reduced memory footprint by 15%
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">Resolved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="optimization">
          <div className="grid gap-6">
            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Performance Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable recommendations to improve system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Database Optimizations */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Database Optimizations
                    </h4>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Add database indexes</p>
                          <p className="text-sm text-muted-foreground">
                            Index frequently queried columns (user.email, subscription.status)
                          </p>
                        </div>
                        <Badge variant="destructive">High Impact</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Implement query caching</p>
                          <p className="text-sm text-muted-foreground">
                            Cache frequently accessed data with Redis
                          </p>
                        </div>
                        <Badge variant="default">Medium Impact</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Frontend Optimizations */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Frontend Optimizations
                    </h4>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Implement code splitting</p>
                          <p className="text-sm text-muted-foreground">
                            Split large bundles into smaller chunks for faster loading
                          </p>
                        </div>
                        <Badge variant="default">Medium Impact</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Add React.memo to components</p>
                          <p className="text-sm text-muted-foreground">
                            Prevent unnecessary re-renders of expensive components
                          </p>
                        </div>
                        <Badge variant="outline">Low Impact</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Network Optimizations */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Network Optimizations
                    </h4>
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Enable compression</p>
                          <p className="text-sm text-muted-foreground">
                            Enable gzip/brotli compression for static assets
                          </p>
                        </div>
                        <Badge variant="destructive">High Impact</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Implement CDN</p>
                          <p className="text-sm text-muted-foreground">
                            Use CDN for static assets and global content delivery
                          </p>
                        </div>
                        <Badge variant="default">Medium Impact</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}