import React, { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  Tag, 
  Activity,
  TrendingUp,
  TrendingDown,
  Edit,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";

interface ProductDetailProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onEdit: (productId: string) => void;
}

export default function ProductDetail({ 
  isOpen, 
  onClose, 
  productId,
  onEdit 
}: ProductDetailProps) {
  const { userId } = useAuth();

  const productDetail = useQuery(
    api.products.getProductDetail,
    userId && productId ? {
      adminId: userId,
      productId: productId as any,
    } : "skip"
  );

  const productAnalytics = useQuery(
    api.products.getProductAnalytics,
    userId && productId ? {
      adminId: userId,
      productId: productId as any,
      timeframe: "30d",
    } : "skip"
  );

  if (!productDetail) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading product details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { product, subscriptions, recentActivity } = productDetail;
  const analytics = productAnalytics?.analytics?.[0];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
              <DialogDescription className="mt-2">
                Detailed information about this product
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={product.isActive ? "default" : "secondary"}
                className={product.isActive ? "bg-green-100 text-green-800" : ""}
              >
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button onClick={() => onEdit(product._id)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Description
                    </Label>
                    <p className="mt-1">{product.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Category
                    </Label>
                    <p className="mt-1">
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No category</span>
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Created Date
                    </Label>
                    <p className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {product.createdAt ? formatDate(product.createdAt) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </Label>
                    <p className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {product.updatedAt ? formatDate(product.updatedAt) : "N/A"}
                    </p>
                  </div>
                </div>

                {product.polarProductId && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Polar.sh Product ID
                      </Label>
                      <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                        {product.polarProductId}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <PolarPricingCard productId={productId} />

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subscriptions.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {subscriptions.active}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled Subscriptions</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {subscriptions.cancelled}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscriptions found for this product.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.items.map((subscription: any) => (
                      <div
                        key={subscription._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {subscription.customerEmail || "Unknown Customer"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created: {subscription.createdAt ? formatDate(subscription.createdAt) : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={subscription.status === "active" ? "default" : "secondary"}
                            className={subscription.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {subscription.status}
                          </Badge>
                          {subscription.amount && (
                            <p className="text-sm text-muted-foreground mt-1">
                              ${(subscription.amount / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.newSubscriptions}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.cancelledSubscriptions}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(analytics.metrics.totalRevenue / 100).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.metrics.conversionRate}%</div>
                      <p className="text-xs text-muted-foreground">Active/Total</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading analytics data...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity found for this product.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any) => (
                      <div
                        key={activity._id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize">
                            {activity.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(activity.timestamp)}
                          </p>
                          {activity.details && (
                            <div className="mt-2 text-xs bg-muted p-2 rounded">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Helper Label component
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}

// Polar Pricing Information Component
const PolarPricingCard = ({ productId }: { productId: string | null }) => {
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  
  const { userId } = useAuth();
  const getPolarPricing = useAction(api.products.getProductPolarPricing);
  const syncProduct = useAction(api.products.syncProductWithPolar);

  useEffect(() => {
    if (productId) {
      loadPricing();
    }
  }, [productId]);

  const loadPricing = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const result = await getPolarPricing({ productId: productId as any });
      setPricing(result);
    } catch (error) {
      console.error("Failed to load pricing:", error);
      setPricing(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!productId || !userId) return;
    
    setSyncing(true);
    try {
      const result = await syncProduct({ 
        adminId: userId, 
        productId: productId as any 
      });
      setSyncResult(result);
      if (result.success) {
        await loadPricing(); // Reload pricing after sync
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: error.message || "Failed to sync product"
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Information
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSync}
              variant="outline"
              size="sm"
              disabled={syncing || !pricing}
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync
            </Button>
            {pricing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://polar.sh/dashboard/products/${pricing.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {syncResult && (
          <div className={`mb-4 p-3 rounded-lg border ${
            syncResult.success 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <p className="text-sm font-medium">{syncResult.message}</p>
            {syncResult.success && syncResult.polarProduct && (
              <div className="text-xs mt-1 space-y-1">
                <p>Type: {syncResult.polarProduct.type}</p>
                <p>Prices: {syncResult.polarProduct.pricesCount}</p>
                <p>Recurring: {syncResult.polarProduct.isRecurring ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        )}

        {!pricing ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pricing information available</p>
            <p className="text-sm">Product may not be synced with Polar.sh</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Product Type:</span>
              <Badge variant="outline">
                {pricing.type} {pricing.is_recurring && '(Recurring)'}
              </Badge>
            </div>

            {/* Pricing Plans */}
            {pricing.prices && pricing.prices.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Available Plans:</h4>
                <div className="grid gap-3">
                  {pricing.prices.map((price: any, index: number) => (
                    <div key={price.id || index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {price.amount_type === 'free' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Free
                            </Badge>
                          ) : (
                            <span className="font-semibold text-lg">
                              ${(() => {
                                const priceAmount = price.price_amount || price.amount || price.unit_amount;
                                return typeof priceAmount === 'number' ? (priceAmount / 100).toFixed(0) : 'Custom';
                              })()}
                            </span>
                          )}
                          {price.recurring_interval && (
                            <span className="text-sm text-muted-foreground">
                              per {price.recurring_interval}
                            </span>
                          )}
                        </div>
                        <Badge variant={price.is_archived ? "secondary" : "default"}>
                          {price.is_archived ? "Archived" : "Active"}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Type: {price.type}</p>
                        {price.created_at && (
                          <p>Created: {new Date(price.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No pricing plans configured</p>
              </div>
            )}

            {/* Polar Status */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Polar Status:</span>
                <Badge variant={pricing.is_archived ? "secondary" : "default"}>
                  {pricing.is_archived ? "Archived" : "Active"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function for date formatting
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};