import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requireAdminPermission, PERMISSIONS } from "./permissions";
import { api } from "./_generated/api";

/**
 * Get all products with optional filtering and pagination
 */
export const getAllProducts = query({
  args: {
    adminId: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_PRODUCTS);

    let query = ctx.db.query("products");

    // Apply filters
    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    // Apply ordering and get results
    const limit = args.limit || 20;
    const products = await query.order("desc").take(limit);

    return {
      products,
      hasMore: products.length === limit,
    };
  },
});

/**
 * Get a single product by ID
 */
export const getProduct = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

/**
 * Get product statistics for admin dashboard
 */
export const getProductStats = query({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_PRODUCTS);

    const allProducts = await ctx.db.query("products").collect();
    const activeProducts = allProducts.filter(p => p.isActive);
    const inactiveProducts = allProducts.filter(p => !p.isActive);

    // Get categories
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    return {
      total: allProducts.length,
      active: activeProducts.length,
      inactive: inactiveProducts.length,
      categories: categories.length,
      categoryBreakdown: categories.map(category => ({
        name: category,
        count: allProducts.filter(p => p.category === category).length,
      })),
    };
  },
});

/**
 * Create a new product
 */
export const createProduct = mutation({
  args: {
    adminId: v.string(),
    name: v.string(),
    description: v.string(),
    polarProductId: v.optional(v.string()),
    category: v.optional(v.string()),
    features: v.array(v.string()),
    metadata: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.CREATE_PRODUCTS);

    // Check if product with same name already exists
    const existingProduct = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingProduct) {
      throw new ConvexError("A product with this name already exists");
    }

    // Check if Polar product ID is unique (if provided)
    if (args.polarProductId) {
      const existingPolarProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("polarProductId"), args.polarProductId))
        .first();

      if (existingPolarProduct) {
        throw new ConvexError("A product with this Polar ID already exists");
      }
    }

    // Create the product
    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      polarProductId: args.polarProductId || "",
      category: args.category,
      features: args.features,
      metadata: args.metadata,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "create_product",
      target: "product",
      targetId: productId,
      details: {
        productName: args.name,
        category: args.category,
        isActive: args.isActive ?? true,
      },
    });

    return productId;
  },
});

/**
 * Update an existing product
 */
export const updateProduct = mutation({
  args: {
    adminId: v.string(),
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    polarProductId: v.optional(v.string()),
    category: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_PRODUCTS);

    // Get the existing product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    // Check for name conflicts (if name is being changed)
    if (args.name && args.name !== product.name) {
      const existingProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existingProduct) {
        throw new ConvexError("A product with this name already exists");
      }
    }

    // Check for Polar product ID conflicts (if being changed)
    if (args.polarProductId && args.polarProductId !== product.polarProductId) {
      const existingPolarProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("polarProductId"), args.polarProductId))
        .first();

      if (existingPolarProduct) {
        throw new ConvexError("A product with this Polar ID already exists");
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.polarProductId !== undefined) updateData.polarProductId = args.polarProductId;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.features !== undefined) updateData.features = args.features;
    if (args.metadata !== undefined) updateData.metadata = args.metadata;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    // Update the product
    await ctx.db.patch(args.productId, updateData);

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: "update_product",
      target: "product",
      targetId: args.productId,
      details: {
        productName: args.name || product.name,
        changes: updateData,
        previousState: {
          name: product.name,
          isActive: product.isActive,
          category: product.category,
        },
      },
    });

    return true;
  },
});

/**
 * Delete a product (soft delete by setting isActive to false)
 */
export const deleteProduct = mutation({
  args: {
    adminId: v.string(),
    productId: v.id("products"),
    hardDelete: v.optional(v.boolean()), // For complete removal
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.DELETE_PRODUCTS);

    // Get the product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    // Check if product has active subscriptions
    const activeSubscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("polarProductId"), product.polarProductId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeSubscriptions.length > 0 && args.hardDelete) {
      throw new ConvexError(
        `Cannot permanently delete product with ${activeSubscriptions.length} active subscriptions. Consider deactivating instead.`
      );
    }

    if (args.hardDelete) {
      // Hard delete - completely remove the product
      await ctx.db.delete(args.productId);
    } else {
      // Soft delete - just deactivate
      await ctx.db.patch(args.productId, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    // Log the action
    await ctx.runMutation(api.permissions.logAdminAction, {
      adminId: args.adminId,
      action: args.hardDelete ? "hard_delete_product" : "soft_delete_product",
      target: "product",
      targetId: args.productId,
      details: {
        productName: product.name,
        polarProductId: product.polarProductId,
        activeSubscriptionsCount: activeSubscriptions.length,
      },
    });

    return true;
  },
});

/**
 * Search products by name or description
 */
export const searchProducts = query({
  args: {
    adminId: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_PRODUCTS);

    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchTerm = args.searchTerm.toLowerCase();
    const limit = args.limit || 10;

    const allProducts = await ctx.db.query("products").collect();

    const filteredProducts = allProducts
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit);

    return filteredProducts;
  },
});

/**
 * Sync products with Polar.sh
 */
export const syncWithPolar = action({
  args: {
    adminId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    syncedCount?: number;
    createdCount?: number;
    updatedCount?: number;
    errors?: string[];
  }> => {
    // Check admin permission first
    const hasPermission = await ctx.runQuery(api.permissions.checkAdminPermission, {
      userId: args.adminId,
      permission: PERMISSIONS.EDIT_PRODUCTS,
    });
    
    if (!hasPermission) {
      throw new ConvexError("Access denied: Admin privileges required");
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    if (!polarAccessToken || !polarOrgId) {
      return {
        success: false,
        message: "Polar.sh API credentials not configured. Please set POLAR_ACCESS_TOKEN and POLAR_ORGANIZATION_ID environment variables.",
      };
    }

    try {
      // Fetch products from Polar.sh API
      const response = await fetch(`https://api.polar.sh/v1/products?organization_id=${polarOrgId}`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Polar.sh API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const polarProducts = data.items || [];

      let syncedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      const errors: string[] = [];

      // Get existing products
      const existingProducts = await ctx.runQuery(api.products.getAllProducts, {
        adminId: args.adminId,
      });

      for (const polarProduct of polarProducts) {
        try {
          // Check if product already exists
          const existingProduct = existingProducts.products?.find(
            (p: any) => p.polarProductId === polarProduct.id
          );

          const productData = {
            name: polarProduct.name,
            description: polarProduct.description || "",
            polarProductId: polarProduct.id,
            isActive: polarProduct.is_archived ? false : true,
            category: polarProduct.type || "subscription",
            features: polarProduct.benefits?.map((b: any) => b.description) || [],
            metadata: {
              polarData: polarProduct,
              syncedAt: Date.now(),
            },
          };

          if (existingProduct) {
            // Update existing product
            await ctx.runMutation(api.products.updateProduct, {
              adminId: args.adminId,
              productId: existingProduct._id,
              ...productData,
            });
            updatedCount++;
          } else {
            // Create new product
            await ctx.runMutation(api.products.createProduct, {
              adminId: args.adminId,
              ...productData,
            });
            createdCount++;
          }

          syncedCount++;
        } catch (error: any) {
          errors.push(`Product ${polarProduct.name}: ${error.message}`);
        }
      }

      // Log the sync operation
      await ctx.runMutation(api.permissions.logAdminAction, {
        adminId: args.adminId,
        action: "sync_polar_products",
        target: "products",
        targetId: "bulk_sync",
        details: {
          totalPolarProducts: polarProducts.length,
          syncedCount,
          createdCount,
          updatedCount,
          errorCount: errors.length,
          errors: errors.slice(0, 10), // Limit error details
          timestamp: Date.now(),
        },
      });

      return {
        success: true,
        message: `Successfully synced ${syncedCount} products from Polar.sh`,
        syncedCount,
        createdCount,
        updatedCount,
        errors,
      };
    } catch (error: any) {
      console.error("Failed to sync Polar products:", error);
      
      // Log the error
      await ctx.runMutation(api.permissions.logAdminAction, {
        adminId: args.adminId,
        action: "sync_polar_products_error",
        target: "products",
        targetId: "bulk_sync",
        details: {
          error: error.message,
          timestamp: Date.now(),
        },
      });

      return {
        success: false,
        message: `Failed to sync products: ${error.message}`,
        errors: [error.message],
      };
    }
  },
});

/**
 * Get active products for public display (no admin required)
 */
export const getPublicActiveProducts = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

/**
 * Get active products with pricing for public display (homepage)
 */
type ProductWithPricing = {
  id: string;
  name: string;
  description: string;
  isRecurring: boolean;
  prices: Array<{
    id: string;
    amount: number;
    interval: string;
  }>;
  features: string[];
  metadata?: any;
};

export const getActiveProductsWithPricing = action({
  args: {},
  handler: async (ctx, args): Promise<{ items: ProductWithPricing[] }> => {
    // Get active products from database
    const products: any[] = await ctx.runQuery(api.products.getPublicActiveProducts);

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    console.log("Polar config check:", {
      hasAccessToken: !!polarAccessToken,
      hasOrgId: !!polarOrgId,
      productsCount: products?.length || 0
    });

    if (!polarAccessToken || !polarOrgId || !products) {
      console.log("Using fallback data - Polar not configured or no products");
      // Fallback to database-only data if Polar is not configured
      return {
        items: products?.map((product: any) => ({
          id: product._id,
          name: product.name,
          description: product.description,
          isRecurring: true,
          prices: [{
            id: product.polarProductId || product._id,
            amount: 2900, // Default price
            interval: "month",
          }],
          features: product.features || [],
        })) || []
      };
    }

    try {
      // Fetch pricing information from Polar.sh
      console.log("Calling Polar API with org ID:", polarOrgId);
      const response = await fetch(`https://api.polar.sh/v1/products?organization_id=${polarOrgId}`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Polar API response status:", response.status);
      if (!response.ok) {
        console.error(`Polar.sh API error: ${response.status}`);
        throw new Error(`Polar.sh API error: ${response.status}`);
      }

      const polarData = await response.json();
      const polarProducts = polarData.items || [];
      
      console.log("Polar products received:", polarProducts.length);
      console.log("Local products:", products?.map(p => ({ id: p._id, name: p.name, polarProductId: p.polarProductId })));
      
      // Debug: Log products and pricing summary
      console.log("Products with pricing:", polarProducts.map((p: any) => ({
        name: p.name,
        priceCount: p.prices?.length || 0,
        firstPriceType: p.prices?.[0]?.amount_type,
        firstPriceAmount: p.prices?.[0]?.price_amount || p.prices?.[0]?.amount
      })));

      // Merge local products with Polar pricing data
      const productsWithPricing = products?.map((product: any) => {
        const polarProduct = polarProducts.find((p: any) => p.id === product.polarProductId);
        
        console.log(`Matching product ${product.name}:`, {
          localPolarId: product.polarProductId,
          foundPolarProduct: !!polarProduct,
          polarProductId: polarProduct?.id,
          hasPrices: polarProduct?.prices?.length > 0
        });
        
        if (polarProduct && polarProduct.prices && polarProduct.prices.length > 0) {
          return {
            id: product._id,
            name: product.name,
            description: product.description,
            isRecurring: polarProduct.prices[0].recurring_interval !== null,
            prices: polarProduct.prices.map((price: any) => {
              let amount = 2900; // Default fallback price
              
              if (price.amount_type === 'free') {
                amount = 0;
              } else if (price.amount_type === 'fixed') {
                // Polar.sh 2025 API uses price_amount field
                if (typeof price.price_amount === 'number' && !isNaN(price.price_amount)) {
                  amount = price.price_amount;
                } else {
                  // Fallback to other possible fields
                  const priceAmount = price.amount || price.unit_amount;
                  if (typeof priceAmount === 'number' && !isNaN(priceAmount)) {
                    amount = priceAmount;
                  } else {
                    amount = 2900; // Default fallback
                  }
                }
              } else if (typeof price.amount === 'number' && !isNaN(price.amount)) {
                amount = price.amount;
              }
              
              return {
                id: price.id,
                amount: amount,
                interval: price.recurring_interval || "month",
              };
            }),
            features: product.features || [],
            metadata: product.metadata,
          };
        } else {
          // Fallback for products without Polar pricing
          return {
            id: product._id,
            name: product.name,
            description: product.description,
            isRecurring: true,
            prices: [{
              id: product.polarProductId || product._id,
              amount: 2900, // Default price
              interval: "month",
            }],
            features: product.features || [],
          };
        }
      }) || [];

      console.log("Final homepage pricing:", productsWithPricing?.map(p => ({
        name: p.name,
        price: p.prices[0]?.amount === 0 ? 'Free' : `$${(p.prices[0]?.amount / 100).toFixed(0)}`,
        interval: p.prices[0]?.interval
      })));

      return {
        items: productsWithPricing
      };
    } catch (error) {
      console.error("Failed to fetch Polar pricing:", error);
      
      // Fallback to database-only data
      return {
        items: products?.map((product: any) => ({
          id: product._id,
          name: product.name,
          description: product.description,
          isRecurring: true,
          prices: [{
            id: product.polarProductId || product._id,
            amount: 2900, // Default price
            interval: "month",
          }],
          features: product.features || [],
        })) || []
      };
    }
  },
});

/**
 * Get product analytics data
 */
export const getProductAnalytics = query({
  args: {
    adminId: v.string(),
    productId: v.optional(v.id("products")),
    timeframe: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_ANALYTICS);

    // Calculate time range
    const now = Date.now();
    const timeframes = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const timeframe = args.timeframe || "30d";
    const startTime = now - timeframes[timeframe];

    // Get product(s)
    let products;
    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      products = product ? [product] : [];
    } else {
      products = await ctx.db.query("products").collect();
    }

    // Get subscriptions for analytics
    const subscriptions = await ctx.db.query("subscriptions").collect();

    const analytics = products.map(product => {
      const productSubscriptions = subscriptions.filter(
        (sub: any) => sub.polarProductId === product.polarProductId
      );

      const recentSubscriptions = productSubscriptions.filter(
        (sub: any) => sub.createdAt && sub.createdAt > startTime
      );

      const activeSubscriptions = productSubscriptions.filter(
        (sub: any) => sub.status === "active"
      );

      const cancelledSubscriptions = productSubscriptions.filter(
        (sub: any) => sub.status === "cancelled" && sub.updatedAt && sub.updatedAt > startTime
      );

      const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
        // Simplified revenue calculation - in real implementation, 
        // you'd want to calculate based on billing cycles and amounts
        return sum + (sub.amount || 0);
      }, 0);

      return {
        productId: product._id,
        productName: product.name,
        category: product.category,
        isActive: product.isActive,
        metrics: {
          totalSubscriptions: productSubscriptions.length,
          activeSubscriptions: activeSubscriptions.length,
          newSubscriptions: recentSubscriptions.length,
          cancelledSubscriptions: cancelledSubscriptions.length,
          totalRevenue,
          conversionRate: productSubscriptions.length > 0 
            ? Math.round((activeSubscriptions.length / productSubscriptions.length) * 100) 
            : 0,
        },
      };
    });

    return {
      timeframe,
      analytics,
      summary: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        totalSubscriptions: analytics.reduce((sum, a) => sum + a.metrics.totalSubscriptions, 0),
        totalRevenue: analytics.reduce((sum, a) => sum + a.metrics.totalRevenue, 0),
      },
    };
  },
});

/**
 * Get detailed product information including related subscriptions
 */
export const getProductDetail = query({
  args: {
    adminId: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.VIEW_PRODUCTS);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    // Get related subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("polarProductId"), product.polarProductId))
      .collect();

    // Get recent activity (audit logs related to this product)
    const recentActivity = await ctx.db
      .query("audit_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.eq(q.field("targetId"), args.productId))
      .order("desc")
      .take(10);

    return {
      product,
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.filter((s: any) => s.status === "active").length,
        cancelled: subscriptions.filter((s: any) => s.status === "cancelled").length,
        items: subscriptions.slice(0, 5), // Latest 5 subscriptions
      },
      recentActivity,
    };
  },
});
/**

 * Get Polar pricing information for a specific product
 */
export const getProductPolarPricing = action({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get the product from database
    const product: any = await ctx.runQuery(api.products.getProduct, { 
      productId: args.productId 
    });

    if (!product || !product.polarProductId) {
      return null;
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.POLAR_ORGANIZATION_ID;

    if (!polarAccessToken || !polarOrgId) {
      return null;
    }

    try {
      // Fetch specific product from Polar.sh API
      const response: Response = await fetch(`https://api.polar.sh/v1/products/${product.polarProductId}`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Polar.sh API error for product ${product.polarProductId}: ${response.status}`);
        return null;
      }

      const polarProduct: any = await response.json();
      
      // Debug: Log complete price structure for troubleshooting
      if (polarProduct.prices && polarProduct.prices.length > 0) {
        console.log(`${product.name} complete price data:`, JSON.stringify(polarProduct.prices[0], null, 2));
      }
      
      return {
        id: polarProduct.id,
        name: polarProduct.name,
        description: polarProduct.description,
        prices: polarProduct.prices || [],
        type: polarProduct.type,
        is_recurring: polarProduct.is_recurring,
        is_archived: polarProduct.is_archived,
      };
    } catch (error) {
      console.error("Failed to fetch Polar product pricing:", error);
      return null;
    }
  },
});

/**
 * Enhanced product sync with better pricing information
 */
export const syncProductWithPolar = action({
  args: {
    adminId: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args): Promise<any> => {
    await requireAdminPermission(ctx, args.adminId, PERMISSIONS.EDIT_PRODUCTS);

    const product: any = await ctx.runQuery(api.products.getProduct, { 
      productId: args.productId 
    });

    if (!product || !product.polarProductId) {
      throw new ConvexError("Product not found or not linked to Polar");
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarAccessToken) {
      throw new ConvexError("Polar access token not configured");
    }

    try {
      // Fetch product details from Polar
      const response: Response = await fetch(`https://api.polar.sh/v1/products/${product.polarProductId}`, {
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ConvexError(`Polar API error: ${response.status}`);
      }

      const polarProduct: any = await response.json();

      // Update local product with Polar data
      await ctx.runMutation(api.products.updateProduct, {
        adminId: args.adminId,
        productId: args.productId,
        name: polarProduct.name,
        description: polarProduct.description,
        isActive: !polarProduct.is_archived,
        metadata: {
          ...product.metadata,
          polarSync: {
            lastSyncAt: Date.now(),
            polarType: polarProduct.type,
            isRecurring: polarProduct.is_recurring,
            pricesCount: polarProduct.prices?.length || 0,
          },
        },
      });

      return {
        success: true,
        message: "Product synced successfully with Polar",
        polarProduct: {
          name: polarProduct.name,
          type: polarProduct.type,
          pricesCount: polarProduct.prices?.length || 0,
          isRecurring: polarProduct.is_recurring,
        },
      };
    } catch (error: any) {
      console.error("Failed to sync product with Polar:", error);
      return {
        success: false,
        message: error.message || "Failed to sync with Polar",
      };
    }
  },
});