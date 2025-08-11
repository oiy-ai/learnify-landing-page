import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Monitor
} from "lucide-react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  errorCount: number;
  timestamp: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);

  // Collect performance metrics
  const collectMetrics = (): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
      networkRequests: performance.getEntriesByType('resource').length,
      errorCount: 0, // Would be tracked separately in real implementation
      timestamp: Date.now(),
    };
  };

  // Start/stop monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Collect metrics periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetrics = collectMetrics();
      setCurrentMetrics(newMetrics);
      setMetrics(prev => [...prev.slice(-19), newMetrics]); // Keep last 20 entries
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Calculate averages
  const averages = useMemo(() => {
    if (metrics.length === 0) return null;

    return {
      avgLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length,
      avgRenderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
      avgMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      avgNetworkRequests: metrics.reduce((sum, m) => sum + m.networkRequests, 0) / metrics.length,
    };
  }, [metrics]);

  // Get performance status
  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: "good", color: "bg-green-500" };
    if (value <= thresholds.warning) return { status: "warning", color: "bg-yellow-500" };
    return { status: "poor", color: "bg-red-500" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Performance Monitor</h2>
        </div>
        <Button
          onClick={toggleMonitoring}
          variant={isMonitoring ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          {isMonitoring ? (
            <>
              <Activity className="h-4 w-4" />
              Stop Monitoring
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Start Monitoring
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Metrics</TabsTrigger>
          <TabsTrigger value="history">Performance History</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Load Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics ? `${currentMetrics.loadTime.toFixed(2)}ms` : "N/A"}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentMetrics
                        ? getPerformanceStatus(currentMetrics.loadTime, { good: 100, warning: 300 }).color
                        : "bg-muted"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {currentMetrics && currentMetrics.loadTime <= 100
                      ? "Excellent"
                      : currentMetrics && currentMetrics.loadTime <= 300
                      ? "Good"
                      : "Needs improvement"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Render Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Render Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics ? `${currentMetrics.renderTime.toFixed(2)}ms` : "N/A"}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentMetrics
                        ? getPerformanceStatus(currentMetrics.renderTime, { good: 50, warning: 150 }).color
                        : "bg-muted"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    DOM Content Loaded
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics ? `${currentMetrics.memoryUsage.toFixed(1)}MB` : "N/A"}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentMetrics
                        ? getPerformanceStatus(currentMetrics.memoryUsage, { good: 50, warning: 100 }).color
                        : "bg-muted"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    JS Heap Size
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Network Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics ? currentMetrics.networkRequests : "N/A"}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentMetrics
                        ? getPerformanceStatus(currentMetrics.networkRequests, { good: 20, warning: 50 }).color
                        : "bg-muted"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total Resources
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Averages */}
          {averages && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Averages</CardTitle>
                <CardDescription>
                  Based on {metrics.length} measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Avg Load Time</p>
                    <p className="text-2xl font-bold">{averages.avgLoadTime.toFixed(2)}ms</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Avg Render Time</p>
                    <p className="text-2xl font-bold">{averages.avgRenderTime.toFixed(2)}ms</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Avg Memory Usage</p>
                    <p className="text-2xl font-bold">{averages.avgMemoryUsage.toFixed(1)}MB</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Avg Network Requests</p>
                    <p className="text-2xl font-bold">{averages.avgNetworkRequests.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Recent performance measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p>No performance data available</p>
                  <p className="text-sm">Start monitoring to collect performance metrics</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.slice(-10).reverse().map((metric, index) => (
                    <div key={metric.timestamp} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </Badge>
                        <div className="text-sm">
                          Load: {metric.loadTime.toFixed(2)}ms | 
                          Render: {metric.renderTime.toFixed(2)}ms | 
                          Memory: {metric.memoryUsage.toFixed(1)}MB
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            getPerformanceStatus(metric.loadTime, { good: 100, warning: 300 }).color
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Performance Optimization Tips
              </CardTitle>
              <CardDescription>
                Recommendations to improve application performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Frontend Optimizations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use React.memo() for expensive components</li>
                    <li>• Implement lazy loading for routes and components</li>
                    <li>• Optimize images with proper formats and sizes</li>
                    <li>• Use virtualization for large lists</li>
                    <li>• Minimize bundle size with code splitting</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Backend Optimizations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Implement database query optimization</li>
                    <li>• Use caching strategies (Redis, CDN)</li>
                    <li>• Optimize API response sizes</li>
                    <li>• Implement pagination for large datasets</li>
                    <li>• Use database indexing effectively</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Network Optimizations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Enable gzip compression</li>
                    <li>• Use HTTP/2 for better multiplexing</li>
                    <li>• Implement proper caching headers</li>
                    <li>• Minimize HTTP requests</li>
                    <li>• Use a Content Delivery Network (CDN)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}