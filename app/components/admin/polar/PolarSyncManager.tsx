import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  TrendingUp,
  Zap,
  AlertTriangle,
  Activity,
  Users
} from "lucide-react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/react-router";

interface PolarSyncManagerProps {
  isLoading?: boolean;
}

export function PolarSyncManager({ isLoading = false }: PolarSyncManagerProps) {
  const [syncType, setSyncType] = useState<"subscriptions" | "customers" | "all">("subscriptions");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  
  const { user } = useUser();
  const adminId = user?.id;

  // 获取Polar连接状态
  const connectionStatus = useQuery(
    api.polarSync.checkPolarConnection,
    adminId ? { adminId } : "skip"
  );

  // 获取同步状态
  const syncStatus = useQuery(
    api.polarSync.getSyncStatus,
    adminId ? { adminId } : "skip"
  );

  // 同步数据action
  const syncPolarData = useAction(api.polarSync.syncPolarData);

  const handleSync = async () => {
    if (!adminId) return;
    
    setIsManualSyncing(true);
    try {
      const result = await syncPolarData({
        adminId,
        syncType,
        forceUpdate,
      });
      setLastSyncResult(result);
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSyncTypeLabel = (type: string) => {
    const labels = {
      subscriptions: "Subscriptions",
      customers: "Customers", 
      all: "All Data"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getActionLabel = (action: string) => {
    const labels = {
      POLAR_SYNC_START: "Sync Started",
      POLAR_SYNC_SUCCESS: "Sync Success",
      POLAR_SYNC_PARTIAL: "Partial Success",
      POLAR_SYNC_FAILED: "Sync Failed",
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "POLAR_SYNC_START":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "POLAR_SYNC_SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "POLAR_SYNC_PARTIAL":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "POLAR_SYNC_FAILED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Polar.sh Data Sync
            </CardTitle>
            <CardDescription>
              Manage Polar.sh subscription and customer data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 连接状态卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Polar.sh Connection Status
          </CardTitle>
          <CardDescription>
            Current Polar.sh API connection and configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {connectionStatus?.hasCredentials ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">API Credentials</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus?.hasCredentials ? "Configured" : "Not Configured"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {connectionStatus?.organizationId ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Organization ID</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus?.organizationId || "Not Configured"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {connectionStatus?.tokenConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Access Token</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus?.tokenConfigured ? "Configured" : "Not Configured"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 同步统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Statistics
          </CardTitle>
          <CardDescription>
            Current subscription and customer data statistics in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStatus?.totalSubscriptions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Subscriptions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStatus?.activeSubscriptions || 0}</p>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </div>
          
          {syncStatus?.lastSyncTime && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last sync time: {formatTimestamp(syncStatus.lastSyncTime)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 手动同步 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Manual Data Sync
          </CardTitle>
          <CardDescription>
            Manually synchronize latest subscription and customer data from Polar.sh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!connectionStatus?.hasCredentials && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">API Credentials Not Configured</p>
                  <p className="text-sm">
                    Please configure POLAR_ACCESS_TOKEN and POLAR_ORGANIZATION_ID in environment variables and restart the service.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sync-type">Sync Type</Label>
                <Select value={syncType} onValueChange={(value: any) => setSyncType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sync type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriptions">Subscriptions Only</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="all">All Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="force-update"
                  checked={forceUpdate}
                  onCheckedChange={setForceUpdate}
                />
                <Label htmlFor="force-update" className="text-sm">
                  Force update existing data
                </Label>
              </div>
            </div>

            <Button 
              onClick={handleSync}
              disabled={!connectionStatus?.hasCredentials || isManualSyncing}
              className="w-full"
            >
              {isManualSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Sync {getSyncTypeLabel(syncType)}
                </>
              )}
            </Button>
          </div>

          {/* 同步结果显示 */}
          {lastSyncResult && (
            <Alert className={lastSyncResult.success ? "border-green-200" : "border-red-200"}>
              {lastSyncResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className={`font-medium ${lastSyncResult.success ? "text-green-600" : "text-red-600"}`}>
                    {lastSyncResult.success ? "Sync Successful!" : "Sync Failed"}
                  </p>
                  <p className="text-sm">{lastSyncResult.message}</p>
                  
                  {lastSyncResult.success && (
                    <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                      <div>
                        <span className="font-medium">Created: </span>
                        <Badge variant="default">{lastSyncResult.created}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Updated: </span>
                        <Badge variant="secondary">{lastSyncResult.updated}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Skipped: </span>
                        <Badge variant="outline">{lastSyncResult.skipped}</Badge>
                      </div>
                    </div>
                  )}
                  
                  {lastSyncResult.errors?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600">Error Details:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                        {lastSyncResult.errors.slice(0, 3).map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                        {lastSyncResult.errors.length > 3 && (
                          <li>... {lastSyncResult.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 同步历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync History
          </CardTitle>
          <CardDescription>
            Recent synchronization operation records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncStatus?.recentSyncs?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 mb-2" />
              <p>No sync history records yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncStatus?.recentSyncs?.map((sync: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {getActionIcon(sync.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {getActionLabel(sync.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(sync.timestamp)}
                      </p>
                    </div>
                    
                    {sync.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {sync.details.syncType && (
                          <span className="mr-4">
                            Type: {getSyncTypeLabel(sync.details.syncType)}
                          </span>
                        )}
                        {sync.details.duration && (
                          <span className="mr-4">
                            Duration: {Math.round(sync.details.duration / 1000)}s
                          </span>
                        )}
                        {sync.details.created !== undefined && (
                          <span className="mr-4">
                            Created: {sync.details.created}
                          </span>
                        )}
                        {sync.details.updated !== undefined && (
                          <span className="mr-4">
                            Updated: {sync.details.updated}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}