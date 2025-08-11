import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  HardDrive,
  FileArchive,
  Shield,
  Clock
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface BackupRestoreProps {
  isLoading?: boolean;
}

export function BackupRestore({ isLoading = false }: BackupRestoreProps) {
  const [backupDescription, setBackupDescription] = useState("");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBackup = useMutation(api.settings.createBackup);
  const restoreFromBackup = useMutation(api.settings.restoreFromBackup);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const result = await createBackup({ description: backupDescription });
      if (result.success) {
        setLastBackup(result.backup);
        setBackupDescription("");
        
        // 创建并下载备份文件
        const blob = new Blob([JSON.stringify(result.backup.data, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("备份创建失败:", error);
      alert("备份创建失败: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setRestoreFile(file || null);
    setRestoreResult(null);
  };

  const handleRestore = async () => {
    if (!restoreFile || !confirmCode) {
      alert("请选择备份文件并输入确认码");
      return;
    }

    setIsRestoring(true);
    try {
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);
      
      // 验证备份文件格式
      if (!backupData.version || !backupData.data) {
        throw new Error("无效的备份文件格式");
      }

      const result = await restoreFromBackup({
        backupData,
        confirmCode
      });

      setRestoreResult(result);
      setRestoreFile(null);
      setConfirmCode("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("恢复失败:", error);
      setRestoreResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getTodayConfirmCode = () => {
    return "RESTORE_CONFIRM_" + new Date().toISOString().split('T')[0];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              备份与恢复
            </CardTitle>
            <CardDescription>
              创建系统备份和恢复数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 系统备份 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            创建系统备份
          </CardTitle>
          <CardDescription>
            备份系统数据，包括用户、产品、订阅和设置信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="backup-description">备份描述</Label>
              <Input
                id="backup-description"
                placeholder="输入备份描述（可选）"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                disabled={isCreatingBackup}
              />
            </div>

            <Button 
              onClick={handleCreateBackup} 
              disabled={isCreatingBackup} 
              className="w-full"
            >
              {isCreatingBackup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建备份中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  创建并下载备份
                </>
              )}
            </Button>
          </div>

          {lastBackup && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">备份创建成功！</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>备份时间: {new Date(lastBackup.timestamp).toLocaleString()}</p>
                    <p>文件大小: {formatFileSize(lastBackup.size)}</p>
                    <p>描述: {lastBackup.description}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 备份说明 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileArchive className="h-4 w-4" />
              备份内容
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">用户数据</Badge>
                <span className="text-muted-foreground">用户账户和配置</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">管理员</Badge>
                <span className="text-muted-foreground">管理员权限配置</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">产品数据</Badge>
                <span className="text-muted-foreground">产品和功能配置</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">订阅数据</Badge>
                <span className="text-muted-foreground">订阅和支付信息</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">系统设置</Badge>
                <span className="text-muted-foreground">全局系统配置</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">审计日志</Badge>
                <span className="text-muted-foreground">最近30天操作记录</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 系统恢复 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            从备份恢复
          </CardTitle>
          <CardDescription>
            从备份文件恢复系统数据（危险操作，请谨慎使用）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-amber-600">⚠️ 危险操作警告</p>
                <p className="text-sm">
                  恢复操作将会覆盖现有的系统设置数据。请确保您了解此操作的影响。
                  建议在恢复前先创建当前系统的备份。
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="backup-file">选择备份文件</Label>
              <Input
                ref={fileInputRef}
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isRestoring}
              />
              {restoreFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  已选择: {restoreFile.name} ({formatFileSize(restoreFile.size)})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-code">确认码</Label>
              <Input
                id="confirm-code"
                placeholder={`请输入今日确认码: ${getTodayConfirmCode()}`}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                disabled={isRestoring}
              />
              <p className="text-xs text-muted-foreground mt-1">
                今日确认码: <code className="bg-muted px-1 rounded">{getTodayConfirmCode()}</code>
              </p>
            </div>

            <Button 
              onClick={handleRestore} 
              disabled={!restoreFile || !confirmCode || isRestoring} 
              variant="destructive"
              className="w-full"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  恢复中...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  开始恢复
                </>
              )}
            </Button>
          </div>

          {restoreResult && (
            <Alert className={restoreResult.success ? "border-green-200" : "border-red-200"}>
              {restoreResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p className={`font-medium ${restoreResult.success ? "text-green-600" : "text-red-600"}`}>
                    {restoreResult.success ? "恢复成功！" : "恢复失败"}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {restoreResult.success ? (
                      <div>
                        <p>{restoreResult.message}</p>
                        {restoreResult.restoredTables && (
                          <p>已恢复的数据表: {restoreResult.restoredTables.join(", ")}</p>
                        )}
                      </div>
                    ) : (
                      <p>错误信息: {restoreResult.error}</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 恢复说明 */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-red-700">
              <Shield className="h-4 w-4" />
              重要提醒
            </h4>
            <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
              <li>当前版本仅支持恢复系统设置数据</li>
              <li>恢复操作不可逆，请谨慎操作</li>
              <li>建议在生产环境中使用前进行充分测试</li>
              <li>恢复前请确保备份文件的完整性和有效性</li>
              <li>如有疑问，请联系系统管理员</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}