# 项目架构文档

## 技术栈概览

### 前端技术栈
- **React Router v7** - 全栈React框架，支持SSR，配置为Vercel部署
- **TypeScript** - 全项目类型安全
- **TailwindCSS v4** - 样式框架
- **shadcn/ui** - UI组件库
- **Clerk** - 身份认证和用户管理
- **Convex React Hooks** - 实时数据同步

### 后端技术栈
- **Convex** - 无服务器实时数据库和后端函数
- **Polar.sh** - 订阅计费和支付处理
- **OpenAI API** - AI聊天功能
- **Webhook处理** - 订阅状态同步

## 项目目录结构

```
ringbot/
├── app/                          # 前端应用代码
│   ├── components/               # 可复用组件
│   │   ├── ui/                  # shadcn/ui基础组件
│   │   ├── dashboard/           # 仪表板组件
│   │   └── homepage/            # 主页组件
│   ├── hooks/                   # 自定义React钩子
│   ├── lib/                     # 工具函数
│   ├── routes/                  # 路由组件
│   │   ├── dashboard/           # 仪表板路由
│   │   ├── home.tsx            # 主页
│   │   ├── pricing.tsx         # 定价页面
│   │   ├── sign-in.tsx         # 登录页面
│   │   └── sign-up.tsx         # 注册页面
│   ├── root.tsx                 # 应用根组件
│   └── routes.ts                # 路由配置
├── convex/                       # 后端函数和数据库模式
│   ├── _generated/              # 自动生成的API类型
│   ├── schema.ts                # 数据库模式定义
│   ├── http.ts                  # HTTP端点（AI聊天和webhooks）
│   ├── subscriptions.ts         # 订阅管理函数
│   ├── users.ts                 # 用户管理函数
│   └── auth.config.ts           # 认证配置
├── public/                       # 静态资源
├── buildplan/                    # 项目规划文档
├── CLAUDE.md                     # Claude AI开发指导
└── 配置文件
```

## 数据模型

### users表
```typescript
{
  name?: string,           // 用户姓名
  email?: string,          // 用户邮箱
  image?: string,          // 用户头像
  tokenIdentifier: string  // Clerk用户标识符
}
```

### subscriptions表
```typescript
{
  userId?: string,                      // 用户ID
  polarId?: string,                     // Polar订阅ID
  polarPriceId?: string,                // Polar价格ID
  currency?: string,                    // 货币类型
  interval?: string,                    // 订阅周期
  status?: string,                      // 订阅状态
  currentPeriodStart?: number,          // 当前周期开始时间
  currentPeriodEnd?: number,            // 当前周期结束时间
  cancelAtPeriodEnd?: boolean,          // 是否在周期结束时取消
  amount?: number,                      // 订阅金额
  startedAt?: number,                   // 订阅开始时间
  endsAt?: number,                      // 订阅结束时间
  endedAt?: number,                     // 实际结束时间
  canceledAt?: number,                  // 取消时间
  customerCancellationReason?: string,  // 取消原因
  customerCancellationComment?: string, // 取消评论
  metadata?: any,                       // 元数据
  customFieldData?: any,                // 自定义字段数据
  customerId?: string                   // 客户ID
}
```

### webhookEvents表
```typescript
{
  type: string,        // 事件类型
  polarEventId: string, // Polar事件ID
  createdAt: string,   // 创建时间
  modifiedAt: string,  // 修改时间
  data: any           // 事件数据
}
```

## 关键集成点

### 认证流程
- Clerk处理认证，与React Router集成
- 用户数据通过`users.ts`函数同步到Convex数据库
- 受保护的路由使用加载器进行服务端认证检查

### 订阅管理
- Polar.sh产品动态获取，用于定价页面
- Webhook端点`/payments/webhook`处理订阅事件
- 订阅状态存储在Convex中，在受保护路由中检查

### AI聊天功能
- 通过Convex HTTP端点`/api/chat`集成OpenAI
- 使用Vercel AI SDK的流式响应
- 聊天UI位于`routes/dashboard/chat.tsx`

### 实时更新
- Convex提供实时数据同步
- 组件使用Convex钩子获取响应式数据

## 环境配置

### 必需的环境变量
```
CONVEX_DEPLOYMENT        # Convex部署标识符
VITE_CONVEX_URL         # Convex客户端URL
VITE_CLERK_PUBLISHABLE_KEY # Clerk公钥
CLERK_SECRET_KEY        # Clerk私钥
POLAR_ACCESS_TOKEN      # Polar.sh API令牌
POLAR_ORGANIZATION_ID   # Polar.sh组织ID
POLAR_WEBHOOK_SECRET    # Webhook验证密钥
OPENAI_API_KEY          # OpenAI API密钥
FRONTEND_URL            # 前端URL（用于CORS）
```

## 部署配置
- 通过`@vercel/react-router`预设配置为Vercel部署
- 支持Docker部署
- 在`react-router.config.ts`中默认启用SSR

## 当前功能状态

### ✅ 已实现功能
- 用户注册和登录（Clerk）
- 订阅计费系统（Polar.sh）
- 基础仪表板界面
- AI聊天功能
- 实时数据同步
- Webhook事件处理
- 订阅状态检查
- 响应式UI组件

### 🚧 需要扩展的功能
- 管理员面板
- 用户管理界面
- 订阅管理界面
- 产品配置界面
- 角色权限系统
- 数据分析和报告
- 更丰富的仪表板功能