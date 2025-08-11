import React, { useState } from "react";
import ProductTable from "~/components/admin/products/ProductTable";
import ProductForm from "~/components/admin/products/ProductForm";
import ProductDetail from "~/components/admin/products/ProductDetail";

export default function AdminProducts() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const handleCreateProduct = () => {
    setFormMode("create");
    setSelectedProductId(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (productId: string) => {
    setFormMode("edit");
    setSelectedProductId(productId);
    setShowProductForm(true);
  };

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId);
    setShowProductDetail(true);
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setSelectedProductId(null);
  };

  const handleCloseDetail = () => {
    setShowProductDetail(false);
    setSelectedProductId(null);
  };

  const handleEditFromDetail = (productId: string) => {
    setShowProductDetail(false);
    handleEditProduct(productId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Configure products, pricing, and features
          </p>
        </div>
      </div>

      {/* Product Table Component */}
      <ProductTable
        onViewDetails={handleViewDetails}
        onEditProduct={handleEditProduct}
        onCreateProduct={handleCreateProduct}
      />

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={handleCloseForm}
        productId={selectedProductId}
        mode={formMode}
      />

      {/* Product Detail Modal */}
      <ProductDetail
        isOpen={showProductDetail}
        onClose={handleCloseDetail}
        productId={selectedProductId}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}