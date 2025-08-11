import { mutation, action, query } from "./_generated/server";
import { getRetellConfig } from "./retellConfig";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAdminPermission, PERMISSIONS } from "./permissions";
import { api } from "./_generated/api";

/**
 * Create Retell LLM for a user
 */
async function createRetellLLM(apiKey: string, shopInfo: string) {
  const llmPayload = {
    model: "gpt-4o",
    general_prompt: `You are a professional AI voice assistant representing a business. Here is the detailed business information:\n\n${shopInfo}\n\nYour role:\n- Answer customer inquiries about products, services, hours, and policies\n- Provide helpful recommendations based on customer needs\n- Maintain a friendly, professional, and knowledgeable tone\n- Stay in character as a business representative at all times\n- If you don't know specific information, politely direct customers to contact the business directly\n- Keep responses concise and natural for voice conversations`,
    states: [
      {
        name: "greeting_and_inquiry",
        state_prompt: "Greet the customer warmly and ask how you can help them today. Listen for their specific needs or questions about the business.",
        edges: [
          {
            description: "When customer expresses a specific need or asks about products/services",
            destination_state_name: "providing_assistance"
          },
          {
            description: "When customer wants general information about the business",
            destination_state_name: "business_information"
          }
        ]
      },
      {
        name: "providing_assistance", 
        state_prompt: "Provide detailed, helpful assistance based on the customer's specific needs. Use the business information to make relevant recommendations and answer questions accurately.",
        edges: [
          {
            description: "When customer is satisfied with the assistance provided",
            destination_state_name: "closing_conversation"
          },
          {
            description: "When customer has additional questions",
            destination_state_name: "business_information"
          }
        ]
      },
      {
        name: "business_information",
        state_prompt: "Share relevant business information such as hours, location, services, or policies. Be informative and helpful.",
        edges: [
          {
            description: "When customer needs specific product assistance",
            destination_state_name: "providing_assistance"
          },
          {
            description: "When customer is ready to end the conversation",
            destination_state_name: "closing_conversation"
          }
        ]
      },
      {
        name: "closing_conversation",
        state_prompt: "Thank the customer for their time, offer any final assistance, and end the conversation professionally. Encourage them to contact the business again if needed.",
        edges: []
      }
    ],
    starting_state: "greeting_and_inquiry",
    general_tools: [
      {
        type: "end_call",
        name: "end_call",
        description: "End the call when the conversation is complete"
      }
    ]
  };

  const llmResponse = await fetch("https://api.retellai.com/create-retell-llm", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(llmPayload)
  });

  if (!llmResponse.ok) {
    const errorText = await llmResponse.text();
    throw new ConvexError(`Failed to create Retell LLM: ${llmResponse.status} ${errorText}`);
  }

  const llmData = await llmResponse.json();
  return llmData.llm_id;
}

/**
 * Create Retell Agent for a user
 */
async function createRetellAgent(apiKey: string, llmId: string) {
  const agentPayload = {
    response_engine: {
      type: "retell-llm",
      llm_id: llmId
    },
    voice_id: "11labs-Adrian", // Default voice, can be customized
    voice_temperature: 1,
    voice_speed: 1,
    responsiveness: 1,
    interruption_sensitivity: 1,
    enable_backchannel: true,
    language: "en-US"
  };

  const agentResponse = await fetch("https://api.retellai.com/create-agent", {
    method: "POST", 
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(agentPayload)
  });

  if (!agentResponse.ok) {
    const errorText = await agentResponse.text();
    throw new ConvexError(`Failed to create Retell Agent: ${agentResponse.status} ${errorText}`);
  }

  const agentData = await agentResponse.json();
  return agentData.agent_id;
}

/**
 * Generate Agent for a user (Admin function)
 */
export const generateUserAgent = action({
  args: {
    adminId: v.string(),
    userId: v.string(),
    shopInfo: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user details via query (actions can call queries)
    const user = await ctx.runQuery(api.users.getUserDetail, {
      adminId: args.adminId,
      userId: args.userId,
    });

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if user has Retell API key
    if (!user.retell_api_key) {
      throw new ConvexError("User does not have a Retell API key configured");
    }

    try {
      // Step 1: Create LLM with shop info as prompt
      const llmId = await createRetellLLM(user.retell_api_key, args.shopInfo);
      
      // Step 2: Create Agent with the LLM
      const agentId = await createRetellAgent(user.retell_api_key, llmId);
      
      // Step 3: Update user record via mutation
      await ctx.runMutation(api.retell.updateUserAgentInfo, {
        adminId: args.adminId,
        userId: args.userId,
        agentId,
        shopInfo: args.shopInfo,
        llmId,
      });

      return {
        success: true,
        agentId,
        llmId,
      };
    } catch (error) {
      // Log the error via mutation
      await ctx.runMutation(api.retell.logAgentGenerationError, {
        adminId: args.adminId,
        userId: args.userId,
        error: error instanceof Error ? error.message : "Unknown error",
        shopInfoLength: args.shopInfo.length,
      });

      throw error;
    }
  },
});

/**
 * Update user agent info (helper mutation for action)
 */
export const updateUserAgentInfo = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    agentId: v.string(),
    shopInfo: v.string(),
    llmId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    // Find the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update user record with agent ID and shop info
    await ctx.db.patch(user._id, {
      retell_agent_id: args.agentId,
      shop_info: args.shopInfo,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "generate_retell_agent",
      target: "user",
      targetId: args.userId,
      details: { 
        agentId: args.agentId,
        llmId: args.llmId,
        shopInfoLength: args.shopInfo.length 
      },
    });

    return { success: true };
  },
});

/**
 * Log agent generation error (helper mutation for action)
 */
export const logAgentGenerationError = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    error: v.string(),
    shopInfoLength: v.number(),
  },
  handler: async (ctx, args) => {
    // Log the error
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "generate_retell_agent_failed",
      target: "user", 
      targetId: args.userId,
      details: { 
        error: args.error,
        shopInfoLength: args.shopInfoLength 
      },
    });

    return { success: true };
  },
});

/**
 * Update user's shop info and regenerate agent
 */
export const updateUserShopInfo = action({
  args: {
    adminId: v.string(),
    userId: v.string(),
    shopInfo: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user details via query
    const user = await ctx.runQuery(api.users.getUserDetail, {
      adminId: args.adminId,
      userId: args.userId,
    });

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update shop info via mutation
    await ctx.runMutation(api.retell.updateShopInfoOnly, {
      adminId: args.adminId,
      userId: args.userId,
      shopInfo: args.shopInfo,
    });

    // If user has API key and wants to regenerate agent
    if (user.retell_api_key) {
      try {
        // Regenerate LLM and Agent
        const llmId = await createRetellLLM(user.retell_api_key, args.shopInfo);
        const agentId = await createRetellAgent(user.retell_api_key, llmId);
        
        // Update with new agent ID via mutation
        await ctx.runMutation(api.retell.updateAgentIdOnly, {
          adminId: args.adminId,
          userId: args.userId,
          agentId,
          llmId,
          shopInfoLength: args.shopInfo.length,
        });

        return {
          success: true,
          agentId,
          llmId,
        };
      } catch (error) {
        // Log error via mutation
        await ctx.runMutation(api.retell.logShopInfoUpdateError, {
          adminId: args.adminId,
          userId: args.userId,
          error: error instanceof Error ? error.message : "Unknown error",
          shopInfoLength: args.shopInfo.length,
        });

        throw error;
      }
    }

    // Log shop info update without agent regeneration
    await ctx.runMutation(api.retell.logShopInfoOnlyUpdate, {
      adminId: args.adminId,
      userId: args.userId,
      shopInfoLength: args.shopInfo.length,
    });

    return {
      success: true,
      agentId: null,
      llmId: null,
    };
  },
});

/**
 * Update shop info only (helper mutation)
 */
export const updateShopInfoOnly = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    shopInfo: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      shop_info: args.shopInfo,
    });

    return { success: true };
  },
});

/**
 * Update agent ID only (helper mutation)
 */
export const updateAgentIdOnly = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    agentId: v.string(),
    llmId: v.string(),
    shopInfoLength: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      retell_agent_id: args.agentId,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_shop_info_and_regenerate_agent",
      target: "user",
      targetId: args.userId,
      details: { 
        newAgentId: args.agentId,
        newLlmId: args.llmId,
        shopInfoLength: args.shopInfoLength 
      },
    });

    return { success: true };
  },
});

/**
 * Log shop info update error (helper mutation)
 */
export const logShopInfoUpdateError = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    error: v.string(),
    shopInfoLength: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_shop_info_agent_regen_failed",
      target: "user",
      targetId: args.userId,
      details: { 
        error: args.error,
        shopInfoLength: args.shopInfoLength 
      },
    });

    return { success: true };
  },
});

/**
 * Log shop info only update (helper mutation)
 */
export const logShopInfoOnlyUpdate = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
    shopInfoLength: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_shop_info_only",
      target: "user",
      targetId: args.userId,
      details: { 
        shopInfoLength: args.shopInfoLength,
        reason: "No API key available for agent regeneration"
      },
    });

    return { success: true };
  },
});

/**
 * Remove user's Retell agent
 */
export const removeUserAgent = mutation({
  args: {
    adminId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_USERS);

    // Find the user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const oldAgentId = user.retell_agent_id;

    // Remove agent ID from user record
    await ctx.db.patch(user._id, {
      retell_agent_id: undefined,
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "remove_retell_agent",
      target: "user",
      targetId: args.userId,
      details: { 
        removedAgentId: oldAgentId 
      },
    });

    return { success: true };
  },
});

/**
 * Create a Retell Web Call and return a short-lived access_token for WebRTC
 */
export const createWebCall = action({
  args: {},
  handler: async (ctx) => {
    // Prefer environment/config to avoid action ctx typing limits for db access
    const { apiKey, agentId } = getRetellConfig();

    // Call Retell Create Web Call API
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ConvexError(`Failed to create web call: ${response.status} ${text}`);
    }

    const data = await response.json();
    // Expecting fields: access_token, call_id, ...
    return {
      access_token: data.access_token as string,
      call_id: data.call_id as string,
    };
  },
});