import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuth } from "@clerk/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";

interface ProductTableProps {
  onViewDetails: (productId: string) => void;
  onEditProduct: (productId: string) => void;
  onCreateProduct: () => void;
}

// Helper component for displaying product pricing
const ProductPricing = ({ product }: { product: any }) => {
  const getPolarPricing = useAction(api.products.getProductPolarPricing);
  const [pricing, setPricing] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (product.polarProductId) {
      setLoading(true);
      getPolarPricing({ productId: product._id })
        .then((result) => {
          console.log(`Pricing data for ${product.name}:`, result);
          setPricing(result);
        })
        .catch((error) => {
          console.error(`Failed to get pricing for ${product.name}:`, error);
          setPricing(null);
        })
        .finally(() => setLoading(false));
    }
  }, [product.polarProductId, product._id, getPolarPricing]);

  if (loading) {
    return <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>;
  }

  if (!pricing || !pricing.prices || pricing.prices.length === 0) {
    return <span className="text-muted-foreground text-sm">No pricing</span>;
  }

  const price = pricing.prices[0];
  
  // Handle free products
  if (price.amount_type === 'free') {
    return <Badge variant="outline" className="bg-green-50 text-green-700">Free</Badge>;
  }

  // Handle fixed price products (Polar.sh 2025 format)
  if (price.amount_type === 'fixed') {
    // Polar.sh 2025 API uses price_amount field
    const priceAmount = price.price_amount || price.amount || price.unit_amount;
    
    if (typeof priceAmount === 'number' && !isNaN(priceAmount)) {
      const displayPrice = (priceAmount / 100).toFixed(0);
      return (
        <div className="text-sm">
          <div className="font-medium">${displayPrice}</div>
          <div className="text-muted-foreground">
            {price.recurring_interval ? `per ${price.recurring_interval}` : 'one-time'}
          </div>
        </div>
      );
    } else {
      // If no amount found, show as configured pricing
      return (
        <div className="text-sm">
          <div className="font-medium">Configured</div>
          <div className="text-muted-foreground">
            {price.recurring_interval ? `per ${price.recurring_interval}` : 'one-time'}
          </div>
        </div>
      );
    }
  }

  // Handle paid products with amount (legacy format)
  if (typeof price.amount === 'number' && !isNaN(price.amount)) {
    const displayPrice = (price.amount / 100).toFixed(0);
    return (
      <div className="text-sm">
        <div className="font-medium">${displayPrice}</div>
        <div className="text-muted-foreground">
          {price.recurring_interval ? `per ${price.recurring_interval}` : 'one-time'}
        </div>
      </div>
    );
  }

  // Handle custom pricing or other types
  if (price.amount_type === 'custom') {
    return <span className="text-muted-foreground text-sm">Custom pricing</span>;
  }

  // Fallback for unknown price types
  return <span className="text-muted-foreground text-sm">Price not available</span>;
};

// Helper component for displaying product type
const ProductType = ({ product }: { product: any }) => {
  if (!product.polarProductId) {
    return <Badge variant="outline">Local</Badge>;
  }

  // This would need to be enhanced with actual Polar product type data
  return <Badge variant="default">Polar</Badge>;
};

// Helper component for displaying Polar ID
const PolarIdDisplay = ({ product }: { product: any }) => {
  if (!product.polarProductId) {
    return <span className="text-muted-foreground text-sm">Not synced</span>;
  }

  return (
    <div className="text-xs font-mono bg-muted px-2 py-1 rounded max-w-24 truncate" title={product.polarProductId}>
      {product.polarProductId.slice(0, 8)}...
    </div>
  );
};

export default function ProductTable({
  onViewDetails,
  onEditProduct,
  onCreateProduct
}: ProductTableProps) {
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const itemsPerPage = 10;

  // Queries
  const productsData = useQuery(
    api.products.getAllProducts,
    userId ? {
      adminId: userId,
      limit: itemsPerPage,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      category: categoryFilter === "all" ? undefined : categoryFilter,
    } : "skip"
  );

  const productStats = useQuery(
    api.products.getProductStats,
    userId ? { adminId: userId } : "skip"
  );

  const searchResults = useQuery(
    api.products.searchProducts,
    userId && searchTerm.trim() ? {
      adminId: userId,
      searchTerm: searchTerm.trim(),
      limit: 20,
    } : "skip"
  );

  // Mutations
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateProduct = useMutation(api.products.updateProduct);

  // Actions
  const syncWithPolar = useAction(api.products.syncWithPolar);

  // Data processing
  const displayProducts = searchTerm.trim()
    ? searchResults || []
    : productsData?.products || [];

  const categories = productStats?.categoryBreakdown?.map(c => c.name) || [];

  const handleDeleteProduct = async (productId: string) => {
    if (!userId) return;

    if (confirm("Are you sure you want to deactivate this product? This will make it unavailable but preserve subscription data.")) {
      try {
        await deleteProduct({
          adminId: userId,
          productId: productId as any,
          hardDelete: false,
        });
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    if (!userId) return;

    try {
      await updateProduct({
        adminId: userId,
        productId: productId as any,
        isActive: !currentStatus,
      });
    } catch (error) {
      console.error("Failed to update product status:", error);
      alert("Failed to update product status. Please try again.");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSyncWithPolar = async () => {
    if (!userId) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncWithPolar({ adminId: userId });
      setSyncResult(result);

      if (result.success) {
        // Refresh the products list by clearing search
        setSearchTerm("");
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: error.message || "Failed to sync with Polar.sh",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productStats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats?.categories || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Products</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {productStats?.inactive || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category || ""}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSyncWithPolar}
            variant="outline"
            disabled={isSyncing}
            className="w-full sm:w-auto"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Syncing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Sync with Polar.sh
              </>
            )}
          </Button>
          <Button onClick={onCreateProduct} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`p-4 rounded-lg border ${syncResult.success
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
          }`}>
          <div className="flex items-start gap-2">
            {syncResult.success ? (
              <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                ✓
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                ✗
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{syncResult.message}</p>
              {syncResult.success && syncResult.createdCount > 0 && (
                <p className="text-sm mt-1">
                  Created {syncResult.createdCount} new products, updated {syncResult.updatedCount} existing products.
                </p>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {syncResult.errors.slice(0, 3).map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {syncResult.errors.length > 3 && (
                      <li>• ... and {syncResult.errors.length - 3} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSyncResult(null)}
              className="text-current hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({displayProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Polar ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm.trim() ? "No products found matching your search." : "No products available."}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayProducts.map((product: any) => (
                    <TableRow key={product._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProductPricing product={product} />
                      </TableCell>
                      <TableCell>
                        <ProductType product={product} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className={product.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.features?.slice(0, 2).map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {product.features?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.features.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PolarIdDisplay product={product} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.createdAt ? formatDate(product.createdAt) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewDetails(product._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditProduct(product._id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(product._id, product.isActive)}
                            >
                              {product.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}