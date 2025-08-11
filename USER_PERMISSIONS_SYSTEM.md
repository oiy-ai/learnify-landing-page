# User Permissions System

This document describes the comprehensive user permissions system implemented in the application, including how to manage permissions for different user roles and how to add new protected routes.

## Overview

The system supports four user roles with different permission levels:
- **Super Admin** - Has all permissions automatically
- **Admin** - Configurable permissions for administrative functions
- **Support** - Limited permissions for customer support tasks
- **User** - Basic permissions for regular application usage

## Architecture

### Core Components

#### 1. Permission Constants (`convex/permissions.ts`)
Defines all available permissions in the system:

```typescript
export const PERMISSIONS = {
  // Page access permissions
  PAGE_ADMIN_DASHBOARD: "page_admin_dashboard",
  PAGE_ADMIN_USERS: "page_admin_users",
  // ... more page permissions
  
  // User dashboard permissions
  ACCESS_DASHBOARD: "access_dashboard",
  ACCESS_CHAT: "access_chat",
  // ... more functional permissions
};
```

#### 2. Role Permission Mappings
Default permissions for each role:

```typescript
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // All permissions
  admin: [/* specific admin permissions */],
  support: [/* specific support permissions */],
  user: [/* specific user permissions */]
};
```

#### 3. Protection Components
- **`AdminRouteWrapper`** - Protects entire admin section
- **`UserPermissionWrapper`** - Protects individual user routes
- **`AdminPageWrapper`** - Protects specific admin pages
- **`AccessDenied`** - Unified access denied interface

## How to Add New Protected Routes

### Quick Reference: Files to Update

When creating a new protected route, you need to update these **5 files** in the following order:

1. **`convex/permissions.ts`** - Define the permission constant
2. **`convex/permissions.ts`** - Add to role permissions mapping  
3. **`app/lib/permissions.ts`** - Mirror the permission for frontend
4. **`app/routes.ts`** - Add the route definition
5. **Your new route file** - Implement with permission wrapper

### Step-by-Step Implementation

### Step 1: Define the Permission (`convex/permissions.ts`)

**Location**: Add to the `PERMISSIONS` object around line 7-73

```typescript
// convex/permissions.ts
export const PERMISSIONS = {
  // Existing permissions...
  
  // ✅ ADD YOUR NEW PERMISSIONS HERE
  PAGE_ADMIN_REPORTS: "page_admin_reports",        // For admin pages
  ACCESS_USER_ANALYTICS: "access_user_analytics",  // For user pages
  MANAGE_REPORTS: "manage_reports",                // For functional permissions
} as const;
```

### Step 2: Update Role Permissions (`convex/permissions.ts`)

**Location**: Update the `ROLE_PERMISSIONS` object around line 76-142

```typescript
// convex/permissions.ts
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // Automatically gets all permissions
  
  admin: [
    // Existing admin permissions...
    PERMISSIONS.PAGE_ADMIN_DASHBOARD,
    PERMISSIONS.PAGE_ADMIN_USERS,
    
    // ✅ ADD YOUR NEW ADMIN PERMISSIONS HERE
    PERMISSIONS.PAGE_ADMIN_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
  ],
  
  support: [
    // Existing support permissions...
    PERMISSIONS.PAGE_ADMIN_DASHBOARD,
    
    // ✅ ADD YOUR NEW SUPPORT PERMISSIONS HERE (if needed)
    PERMISSIONS.PAGE_ADMIN_REPORTS, // Read-only access
  ],
  
  user: [
    // Existing user permissions...
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_CHAT,
    
    // ✅ ADD YOUR NEW USER PERMISSIONS HERE
    PERMISSIONS.ACCESS_USER_ANALYTICS,
  ],
} as const;
```

### Step 3: Mirror Frontend Constants (`app/lib/permissions.ts`)

**Location**: Update the entire `PERMISSIONS` object

```typescript
// app/lib/permissions.ts
/**
 * Permission constants for frontend use
 * This mirrors the permissions defined in convex/permissions.ts
 */
export const PERMISSIONS = {
  // Page access permissions
  PAGE_ADMIN_DASHBOARD: "page_admin_dashboard",
  PAGE_ADMIN_USERS: "page_admin_users",
  // ... existing permissions
  
  // ✅ ADD YOUR NEW PERMISSIONS HERE (mirror from convex/permissions.ts)
  PAGE_ADMIN_REPORTS: "page_admin_reports",
  ACCESS_USER_ANALYTICS: "access_user_analytics", 
  MANAGE_REPORTS: "manage_reports",
  
  // ... rest of existing permissions
} as const;
```

### Step 4: Add Route Definition (`app/routes.ts`)

**Location**: Add to the appropriate layout section

```typescript
// app/routes.ts
export default [
  // ... existing routes
  
  // For admin routes - add inside admin layout around line 26-43
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/index.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    // ... existing admin routes
    
    // ✅ ADD YOUR NEW ADMIN ROUTES HERE
    route("admin/reports", "routes/admin/reports.tsx"),
  ]),
  
  // For user routes - add to main routes around line 8-25
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  // ✅ ADD YOUR NEW USER ROUTES HERE
  route("analytics", "routes/analytics.tsx"),
  
  // For dashboard routes - add inside dashboard layout around line 21-25
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/chat", "routes/dashboard/chat.tsx"),
    // ✅ ADD YOUR NEW DASHBOARD ROUTES HERE
    route("dashboard/analytics", "routes/dashboard/analytics.tsx"),
  ]),
] satisfies RouteConfig;
```

### Step 5: Create Protected Route Files

#### Template for Admin Routes

```typescript
// app/routes/admin/reports.tsx
import { AdminPageWrapper } from "~/components/admin/AdminPageWrapper";
import { PERMISSIONS } from "~/lib/permissions";

export default function AdminReportsPage() {
  return (
    <AdminPageWrapper requiredPermission={PERMISSIONS.PAGE_ADMIN_REPORTS}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
          <p className="text-muted-foreground">
            Manage and view system reports
          </p>
        </div>
        
        {/* Page Content */}
        <div className="grid gap-6">
          {/* Your component content here */}
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Report Analytics</h2>
            {/* Add your actual content */}
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
```

#### Template for User Dashboard Routes

```typescript
// app/routes/dashboard/analytics.tsx
import { UserPermissionWrapper } from "~/components/user/UserPermissionWrapper";
import { PERMISSIONS } from "~/lib/permissions";

export default function UserAnalyticsPage() {
  return (
    <UserPermissionWrapper permission={PERMISSIONS.ACCESS_USER_ANALYTICS}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                  View your usage analytics and statistics
                </p>
              </div>
              
              {/* Page Content */}
              <div className="grid gap-6">
                {/* Your component content here */}
                <div className="rounded-lg border p-6">
                  <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
                  {/* Add your actual content */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserPermissionWrapper>
  );
}
```

#### Template for Standalone User Routes

```typescript
// app/routes/analytics.tsx
import { UserPermissionWrapper } from "~/components/user/UserPermissionWrapper";
import { PERMISSIONS } from "~/lib/permissions";

export default function AnalyticsPage() {
  return (
    <UserPermissionWrapper permission={PERMISSIONS.ACCESS_USER_ANALYTICS}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-lg text-gray-600">
              Detailed analytics and insights
            </p>
          </div>
          
          {/* Page Content */}
          <div className="grid gap-8">
            {/* Your component content here */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
              {/* Add your actual content */}
            </div>
          </div>
        </div>
      </div>
    </UserPermissionWrapper>
  );
}
```

### Step 6: Update Permission Categories (Optional)

**Location**: In `convex/permissions.ts`, update the `getAvailablePermissions` function around line 449-587

```typescript
// convex/permissions.ts - inside getAvailablePermissions function
const permissionGroups = {
  // ... existing categories
  
  // ✅ ADD YOUR NEW CATEGORY HERE
  reports: {
    label: "Reports Management",
    permissions: Object.entries(PERMISSIONS)
      .filter(([key]) => key.includes('REPORT'))
      .map(([key, value]) => ({
        key,
        value,
        label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      }))
  },
  
  // Or add to existing categories
  analytics: {
    label: "Analytics & Reporting", 
    permissions: Object.entries(PERMISSIONS)
      .filter(([key]) => ['ACCESS_USER_ANALYTICS', 'VIEW_ANALYTICS', 'EXPORT_DATA'].includes(key))
      .map(([key, value]) => ({
        key,
        value,
        label: key.replace(/ACCESS_|VIEW_|EXPORT_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      }))
  }
};
```

## Managing User Permissions

### Accessing the Permissions Management Interface

1. Navigate to `/admin/permissions` (requires super_admin or admin with `PAGE_ADMIN_PERMISSIONS`)
2. Select the role tab (Admin Role, Support Role, or User Role)
3. Toggle permissions on/off using checkboxes
4. Click "Save Changes" to apply

### Permission Management Features

- **Real-time Updates**: Changes apply immediately to all users with that role
- **Permission Grouping**: Permissions are organized by category for easier management
- **Bulk Operations**: Enable/disable multiple permissions at once
- **Audit Trail**: All permission changes are logged with timestamp and admin info

### Database Tables

#### `user_role_permissions`
Stores custom permission configurations for the "user" role:
```typescript
{
  role: "user",
  permissions: ["access_dashboard", "access_chat", ...],
  updatedAt: 1673123456789,
  updatedBy: "user_id"
}
```

#### `admins`
Stores admin user records with their permissions:
```typescript
{
  userId: "user_id",
  role: "admin" | "support" | "super_admin",
  permissions: ["page_admin_users", ...],
  isActive: true,
  createdAt: 1673123456789
}
```

## Permission Checking Functions

### Backend (Convex)

#### `checkUserPermission`
Works for both admin and regular users:
```typescript
const hasPermission = await ctx.runQuery(api.permissions.checkUserPermission, {
  userId: "user_id",
  permission: "access_dashboard"
});
```

#### `checkAdminPermission`
Specifically for admin users:
```typescript
const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
  userId: "user_id", 
  permission: "page_admin_users"
});
```

### Frontend (React)

#### Using Permission Wrappers
```typescript
// Protect entire route
<UserPermissionWrapper permission={PERMISSIONS.ACCESS_DASHBOARD}>
  <YourComponent />
</UserPermissionWrapper>

// Protect admin route
<AdminPageWrapper requiredPermission={PERMISSIONS.PAGE_ADMIN_USERS}>
  <YourAdminComponent />
</AdminPageWrapper>
```

#### Direct Permission Checking
```typescript
const { userId } = useAuth();
const hasPermission = useQuery(
  api.permissions.checkUserPermission,
  userId ? { userId, permission: PERMISSIONS.ACCESS_DASHBOARD } : "skip"
);
```

## Best Practices

### 1. Permission Naming Convention
- **Page Access**: `PAGE_ADMIN_{FEATURE}` for admin pages
- **User Access**: `ACCESS_{FEATURE}` for user features
- **Actions**: `{ACTION}_{RESOURCE}` for specific actions (e.g., `EDIT_USERS`)

### 2. Security Guidelines
- Always use permission wrappers for route protection
- Never expose permission names or system internals to users
- Super admin should always have all permissions automatically
- Validate permissions on both frontend and backend

### 3. Testing New Permissions
1. Add the permission following the steps above
2. Test with different user roles
3. Verify permission management interface shows the new permission
4. Test access denied scenarios
5. Check audit logs for permission changes

### 4. Permission Categories
Organize permissions into logical groups:
- **Page Access**: Route-level permissions
- **User Management**: User-related operations
- **Content Management**: Content creation/editing
- **System Administration**: System-level operations
- **Analytics**: Reporting and analytics access

## Troubleshooting

### Common Issues

#### Permission Not Working
1. Check if permission is defined in both `convex/permissions.ts` and `app/lib/permissions.ts`
2. Verify permission is added to appropriate role in `ROLE_PERMISSIONS`
3. Ensure user has been assigned the correct role
4. Check if permission wrapper is properly implemented

#### Permission Not Showing in Management Interface
1. Verify permission is added to `getAvailablePermissions` function
2. Check permission category mapping
3. Ensure proper permission key naming

#### User Still Has Access After Permission Removal
1. Check browser cache - reload the page
2. Verify permission was actually saved (check database)
3. Confirm user role assignment is correct

### Debugging Tools

#### Check User Permissions
```typescript
// In browser console or debug component
const permissions = await convex.query(api.permissions.checkUserPermission, {
  userId: "user_id",
  permission: "permission_name"
});
```

#### Audit Permission Changes
```typescript
const auditLogs = await convex.query(api.permissions.getAuditLogs, {
  target: "role",
  limit: 50
});
```

## Security Considerations

1. **Never expose internal permission names** to end users
2. **Always validate permissions server-side** even if checked on frontend
3. **Use permission wrappers consistently** for all protected content
4. **Audit all permission changes** for security compliance
5. **Regularly review user permissions** and remove unnecessary access

## Migration Guide

If you're adding this system to existing routes:

1. **Identify all routes** that need protection
2. **Define appropriate permissions** for each route
3. **Add permission wrappers** to existing components
4. **Update user roles** with appropriate permissions
5. **Test thoroughly** with different user roles
6. **Update documentation** for your team

---

This permissions system provides a flexible, secure, and maintainable way to control access to different parts of your application. Always follow the established patterns and test thoroughly when making changes.