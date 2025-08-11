import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { 
  FileText, 
  Filter, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Calendar
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface SystemLogsProps {
  isLoading?: boolean;
}

export function SystemLogs({ isLoading = false }: SystemLogsProps) {
  const [filters, setFilters] = useState({
    level: "" as "" | "info" | "warning" | "error",
    dateRange: "",
    search: "",
    limit: 50,
  });

  // 计算日期范围
  const getDateRange = () => {
    const now = Date.now();
    const ranges: Record<string, { start?: number; end?: number }> = {
      "today": { start: now - 24 * 60 * 60 * 1000 },
      "week": { start: now - 7 * 24 * 60 * 60 * 1000 },
      "month": { start: now - 30 * 24 * 60 * 60 * 1000 },
    };
    return ranges[filters.dateRange] || {};
  };

  // 获取系统日志
  const logsData = useQuery(api.settings.getSystemLogs, {
    limit: filters.limit,
    level: filters.level === "" ? undefined : filters.level,
    ...getDateRange(),
  });

  const handleRefresh = () => {
    // 触发重新获取数据
    window.location.reload();
  };

  const handleExport = () => {
    if (!logsData?.logs) return;
    
    const csvContent = [
      "时间,级别,操作,管理员,目标,消息",
      ...logsData.logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.level,
        log.action,
        log.adminId,
        log.target,
        log.message.replace(/,/g, ";")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredLogs = logsData?.logs?.filter(log => {
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading || !logsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            系统日志
          </CardTitle>
          <CardDescription>
            查看系统操作日志和审计记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">加载日志中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              系统日志
            </CardTitle>
            <CardDescription>
              查看系统操作日志和审计记录（共 {logsData.total} 条记录）
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 过滤器 */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">过滤条件:</span>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="搜索日志..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="max-w-xs"
            />
            
            <Select 
              value={filters.level} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, level: value as "" | "error" | "warning" | "info" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="日志级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部级别</SelectItem>
                <SelectItem value="info">信息</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="error">错误</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">最近一周</SelectItem>
                <SelectItem value="month">最近一月</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.limit.toString()} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="显示数量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 条</SelectItem>
                <SelectItem value="50">50 条</SelectItem>
                <SelectItem value="100">100 条</SelectItem>
                <SelectItem value="200">200 条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 日志表格 */}
        <div className="border rounded-lg">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">时间</TableHead>
                  <TableHead className="w-[80px]">级别</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                  <TableHead className="w-[100px]">目标</TableHead>
                  <TableHead>消息</TableHead>
                  <TableHead className="w-[100px]">管理员</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      没有找到符合条件的日志记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.level)}
                          <Badge variant={getLogBadgeVariant(log.level) as any} className="text-xs">
                            {log.level}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.target}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.message}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.adminId.slice(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 分页信息 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            显示 {Math.min(filteredLogs.length, filters.limit)} 条记录
            {logsData.hasMore && <span className="ml-2">(有更多记录)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>最后更新: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}