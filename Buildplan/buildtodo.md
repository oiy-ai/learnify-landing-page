# 开发任务清单 - 管理员系统扩展

## 项目目标
基于现有订阅制公司首页，添加完整的后端管理系统，实现用户管理、订阅管理和产品配置功能。

## 阶段一：数据模型扩展和权限系统 🏗️

### 1.1 扩展数据库模式
**文件修改**: `convex/schema.ts`
- [ ] 添加管理员角色字段到users表
- [ ] 创建admins表存储管理员权限
- [ ] 创建products表存储产品配置
- [ ] 创建audit_logs表记录管理操作
- [ ] 添加user_sessions表跟踪用户活动

```typescript
// 新增表结构
admins: defineTable({
  userId: v.string(),
  role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("support")),
  permissions: v.array(v.string()),
  createdAt: v.number(),
  createdBy: v.optional(v.string())
})

products: defineTable({
  name: v.string(),
  description: v.string(),
  polarProductId: v.string(),
  isActive: v.boolean(),
  category: v.optional(v.string()),
  features: v.array(v.string()),
  metadata: v.optional(v.any())
})

audit_logs: defineTable({
  adminId: v.string(),
  action: v.string(),
  target: v.string(),
  targetId: v.string(),
  details: v.optional(v.any()),
  timestamp: v.number()
})
```

### 1.2 权限管理系统
**新建文件**: `convex/permissions.ts`
- [ ] 实现权限检查函数
- [ ] 创建角色权限映射
- [ ] 添加管理员验证中间件

### 1.3 管理员认证函数
**新建文件**: `convex/admin.ts`
- [ ] `checkAdminPermission` - 检查管理员权限
- [ ] `promoteUserToAdmin` - 提升用户为管理员
- [ ] `revokeAdminAccess` - 撤销管理员权限
- [ ] `getAdminProfile` - 获取管理员信息

## 阶段二：管理员路由和布局 🚀

### 2.1 管理员路由配置
**文件修改**: `app/routes.ts`
- [ ] 添加admin路由组
- [ ] 配置受保护的管理员路由

```typescript
layout("routes/admin/layout.tsx", [
  route("admin", "routes/admin/index.tsx"),
  route("admin/users", "routes/admin/users.tsx"),
  route("admin/subscriptions", "routes/admin/subscriptions.tsx"),
  route("admin/products", "routes/admin/products.tsx"),
  route("admin/analytics", "routes/admin/analytics.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
])
```

### 2.2 管理员布局组件
**新建文件**: `app/routes/admin/layout.tsx`
- [ ] 创建管理员专用布局
- [ ] 添加管理员权限验证loader
- [ ] 集成管理员侧边栏导航

**新建文件**: `app/components/admin/admin-sidebar.tsx`
- [ ] 管理员导航菜单
- [ ] 权限基础的菜单显示
- [ ] 操作统计快捷入口

## 阶段三：用户管理系统 👥

### 3.1 用户管理页面
**新建文件**: `app/routes/admin/users.tsx`
- [ ] 用户列表展示（分页、搜索、筛选）
- [ ] 用户详情查看
- [ ] 用户状态管理（激活/禁用）
- [ ] 批量操作功能

### 3.2 用户管理组件
**新建目录**: `app/components/admin/users/`
- [ ] `UserTable.tsx` - 用户数据表格
- [ ] `UserDetail.tsx` - 用户详情弹窗
- [ ] `UserActions.tsx` - 用户操作按钮组
- [ ] `UserFilters.tsx` - 用户筛选器
- [ ] `UserStats.tsx` - 用户统计卡片

### 3.3 用户管理后端函数
**文件修改**: `convex/users.ts`
- [ ] `getAllUsers` - 获取所有用户（分页）
- [ ] `getUserDetail` - 获取用户详情
- [ ] `updateUserStatus` - 更新用户状态
- [ ] `deleteUser` - 删除用户
- [ ] `searchUsers` - 搜索用户
- [ ] `getUserActivity` - 获取用户活动记录

## 阶段四：订阅管理系统 💳

### 4.1 订阅管理页面
**新建文件**: `app/routes/admin/subscriptions.tsx`
- [ ] 订阅列表展示
- [ ] 订阅状态监控
- [ ] 收入统计分析
- [ ] 订阅操作管理

### 4.2 订阅管理组件
**新建目录**: `app/components/admin/subscriptions/`
- [ ] `SubscriptionTable.tsx` - 订阅数据表格
- [ ] `SubscriptionDetail.tsx` - 订阅详情
- [ ] `RevenueChart.tsx` - 收入图表
- [ ] `SubscriptionFilters.tsx` - 订阅筛选
- [ ] `SubscriptionActions.tsx` - 订阅操作

### 4.3 订阅管理后端函数
**文件修改**: `convex/subscriptions.ts`
- [ ] `getAllSubscriptions` - 获取所有订阅
- [ ] `getSubscriptionAnalytics` - 获取订阅分析数据
- [ ] `cancelSubscription` - 取消订阅
- [ ] `refundSubscription` - 退款处理
- [ ] `getRevenueData` - 获取收入数据
- [ ] `getChurnAnalysis` - 获取流失分析

## 阶段五：产品配置系统 🛍️

### 5.1 产品管理页面
**新建文件**: `app/routes/admin/products.tsx`
- [ ] 产品列表管理
- [ ] 创建/编辑产品
- [ ] 价格管理
- [ ] 产品状态控制

### 5.2 产品管理组件
**新建目录**: `app/components/admin/products/`
- [ ] `ProductTable.tsx` - 产品列表表格
- [ ] `ProductForm.tsx` - 产品编辑表单
- [ ] `PriceManager.tsx` - 价格管理器
- [ ] `ProductPreview.tsx` - 产品预览
- [ ] `FeatureEditor.tsx` - 功能特性编辑器

### 5.3 产品管理后端函数
**新建文件**: `convex/products.ts`
- [ ] `getAllProducts` - 获取所有产品
- [ ] `createProduct` - 创建产品
- [ ] `updateProduct` - 更新产品
- [ ] `deleteProduct` - 删除产品
- [ ] `syncWithPolar` - 与Polar.sh同步产品
- [ ] `getProductAnalytics` - 产品分析数据

## 阶段六：数据分析和报告系统 📊

### 6.1 分析仪表板
**新建文件**: `app/routes/admin/analytics.tsx`
- [ ] 关键指标展示
- [ ] 用户增长图表
- [ ] 收入分析图表
- [ ] 产品性能分析

### 6.2 分析组件
**新建目录**: `app/components/admin/analytics/`
- [ ] `MetricsGrid.tsx` - 指标网格
- [ ] `GrowthChart.tsx` - 增长图表
- [ ] `RevenueBreakdown.tsx` - 收入分解
- [ ] `UserSegmentation.tsx` - 用户分段
- [ ] `ConversionFunnel.tsx` - 转化漏斗

### 6.3 分析后端函数
**新建文件**: `convex/analytics.ts`
- [ ] `getKPIMetrics` - 获取关键指标
- [ ] `getUserGrowthData` - 用户增长数据
- [ ] `getRevenueAnalytics` - 收入分析
- [ ] `getConversionMetrics` - 转化指标
- [ ] `getRetentionAnalysis` - 留存分析

## 阶段七：系统设置和配置 ⚙️

### 7.1 系统设置页面
**新建文件**: `app/routes/admin/settings.tsx`
- [ ] 全局系统设置
- [ ] 管理员账户管理
- [ ] 系统日志查看
- [ ] 备份和恢复

### 7.2 设置组件
**新建目录**: `app/components/admin/settings/`
- [ ] `GeneralSettings.tsx` - 通用设置
- [ ] `AdminManagement.tsx` - 管理员管理
- [ ] `SystemLogs.tsx` - 系统日志
- [ ] `BackupRestore.tsx` - 备份恢复

### 7.3 设置后端函数
**文件修改**: `convex/admin.ts`
- [ ] `updateSystemSettings` - 更新系统设置
- [ ] `getSystemLogs` - 获取系统日志
- [ ] `createBackup` - 创建备份
- [ ] `restoreFromBackup` - 从备份恢复

## 阶段八：安全性和优化 🔒

### 8.1 安全性增强
- [ ] 实现细粒度权限控制
- [ ] 添加操作审计日志
- [ ] 实现IP白名单功能
- [ ] 添加两步验证支持

### 8.2 性能优化
- [ ] 实现数据分页和虚拟化
- [ ] 添加缓存策略
- [ ] 优化数据库查询
- [ ] 实现懒加载

### 8.3 错误处理和监控
- [ ] 统一错误处理机制
- [ ] 添加错误边界组件
- [ ] 实现操作确认对话框
- [ ] 添加用户操作反馈

## 阶段九：测试和部署 🧪

### 9.1 单元测试
- [ ] 后端函数测试
- [ ] 组件单元测试
- [ ] 权限系统测试
- [ ] API端点测试

### 9.2 集成测试
- [ ] 用户流程测试
- [ ] 管理员工作流测试
- [ ] 支付流程测试
- [ ] 数据一致性测试

### 9.3 部署配置
- [ ] 环境变量配置
- [ ] 数据库迁移脚本
- [ ] 部署文档更新
- [ ] 监控和日志配置

## 预估时间线

- **阶段一**: 2-3天 (数据模型和权限)
- **阶段二**: 1-2天 (路由和布局)
- **阶段三**: 3-4天 (用户管理)
- **阶段四**: 3-4天 (订阅管理)
- **阶段五**: 2-3天 (产品配置)
- **阶段六**: 3-4天 (数据分析)
- **阶段七**: 2-3天 (系统设置)
- **阶段八**: 2-3天 (安全和优化)
- **阶段九**: 2-3天 (测试和部署)

**总计**: 20-29天

## 技术注意事项

1. **权限控制**: 所有管理员功能都需要严格的权限验证
2. **数据安全**: 敏感操作需要二次确认
3. **性能考虑**: 大数据量时的分页和优化
4. **用户体验**: 响应式设计和加载状态管理
5. **错误处理**: 友好的错误提示和回滚机制

## 依赖要求

现有依赖已满足大部分需求，可能需要额外添加：
- 数据可视化库（如recharts，已包含）
- 表格组件（@tanstack/react-table，已包含）
- 日期处理库（如date-fns）
- 导出功能库（如xlsx）