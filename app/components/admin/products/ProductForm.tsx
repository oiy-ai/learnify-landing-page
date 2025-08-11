import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { X, Plus } from "lucide-react";
import { api } from "../../../../convex/_generated/api";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | null;
  mode: "create" | "edit";
}

interface ProductFormData {
  name: string;
  description: string;
  polarProductId: string;
  category: string;
  features: string[];
  isActive: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  polarProductId: "",
  category: "",
  features: [],
  isActive: true,
};

export default function ProductForm({ 
  isOpen, 
  onClose, 
  productId, 
  mode 
}: ProductFormProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [newFeature, setNewFeature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const productDetail = useQuery(
    api.products.getProductDetail,
    userId && productId && mode === "edit" 
      ? { adminId: userId, productId: productId as any }
      : "skip"
  );

  const productStats = useQuery(
    api.products.getProductStats,
    userId ? { adminId: userId } : "skip"
  );

  // Mutations
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);

  // Load product data for editing
  useEffect(() => {
    if (mode === "edit" && productDetail?.product) {
      const product = productDetail.product;
      setFormData({
        name: product.name || "",
        description: product.description || "",
        polarProductId: product.polarProductId || "",
        category: product.category || "",
        features: product.features || [],
        isActive: product.isActive ?? true,
      });
    } else if (mode === "create") {
      setFormData(initialFormData);
    }
  }, [mode, productDetail]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setNewFeature("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addFeature = () => {
    const feature = newFeature.trim();
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    
    try {
      const submitData = {
        adminId: userId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        polarProductId: formData.polarProductId.trim() || undefined,
        category: formData.category.trim() || undefined,
        features: formData.features,
        isActive: formData.isActive,
      };

      if (mode === "create") {
        await createProduct(submitData);
      } else if (mode === "edit" && productId) {
        await updateProduct({
          ...submitData,
          productId: productId as any,
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingCategories = productStats?.categoryBreakdown?.map(c => c.name) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new product to your catalog."
              : "Update the product information."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or type category" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCategories.map((category) => (
                          <SelectItem key={category} value={category || ""}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      placeholder="Or type new category"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter product description"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="polarProductId">Polar.sh Product ID</Label>
                <Input
                  id="polarProductId"
                  value={formData.polarProductId}
                  onChange={(e) => handleInputChange("polarProductId", e.target.value)}
                  placeholder="Enter Polar.sh product ID (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Link this product to a Polar.sh product for subscription management
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button type="button" onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {formData.features.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No features added yet. Add features to help describe your product.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive products won't be available for new subscriptions
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Summary (for edit mode) */}
          {mode === "edit" && productDetail?.subscriptions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Subscriptions</p>
                    <p className="text-2xl font-bold">{productDetail.subscriptions.total}</p>
                  </div>
                  <div>
                    <p className="font-medium">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-green-600">
                      {productDetail.subscriptions.active}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Cancelled Subscriptions</p>
                    <p className="text-2xl font-bold text-red-600">
                      {productDetail.subscriptions.cancelled}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? "Saving..." 
                : mode === "create" 
                  ? "Create Product" 
                  : "Update Product"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}