import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("super_admin"))),
    isActive: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    retell_api_key: v.optional(v.string()),
    retell_agent_id: v.optional(v.string()),
    shop_info: v.optional(v.string()),
    user_agent_json: v.optional(v.any()),
  }).index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),
  
  admins: defineTable({
    userId: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("support")),
    permissions: v.array(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    polarProductId: v.string(),
    isActive: v.boolean(),
    category: v.optional(v.string()),
    features: v.array(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
  }).index("by_polar_id", ["polarProductId"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"]),

  audit_logs: defineTable({
    adminId: v.string(),
    action: v.string(),
    target: v.string(),
    targetId: v.string(),
    details: v.optional(v.any()),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_admin", ["adminId"])
    .index("by_target", ["target"])
    .index("by_timestamp", ["timestamp"]),

  user_sessions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    loginAt: v.number(),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_active", ["isActive"]),
  subscriptions: defineTable({
    userId: v.optional(v.string()),
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    polarProductId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("polarId", ["polarId"])
    .index("polarProductId", ["polarProductId"])
    .index("status", ["status"])
    .index("createdAt", ["createdAt"]),
  webhookEvents: defineTable({
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
  })
    .index("type", ["type"])
    .index("polarEventId", ["polarEventId"]),

  system_settings: defineTable({
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("json"),
      v.literal("array")
    ),
    isPublic: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"]),

  user_role_permissions: defineTable({
    role: v.string(),
    permissions: v.array(v.string()),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_role", ["role"]),
});
