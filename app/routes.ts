import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("edit", "routes/edit.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  route("subscription-required", "routes/subscription-required.tsx"),
  route("admin-setup", "routes/admin-setup.tsx"),
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/chat", "routes/dashboard/chat.tsx"),
    route("dashboard/settings", "routes/dashboard/settings.tsx"),
  ]),
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/index.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    route("admin/subscriptions", "routes/admin/subscriptions.tsx"),
    route("admin/products", "routes/admin/products.tsx"),
    route("admin/analytics", "routes/admin/analytics.tsx"),
    route("admin/permissions", "routes/admin/permissions.tsx"),
    route("admin/settings", "routes/admin/settings.tsx"),
    route("admin/security", "routes/admin/security.tsx"),
    route("admin/performance", "routes/admin/performance.tsx"),
    route("admin/quick-admin-setup", "routes/admin/quick-admin-setup.tsx"),
    route("admin/polar-setup", "routes/admin/polar-setup.tsx"),
  ]),
] satisfies RouteConfig;
