// client/src/pages/admin/ProductDetailPage.jsx
import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Package, Check } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import ProductInformationCard from "@/components/admin/ProductInformationCard";
import RentalPricingCard from "@/components/admin/RentalPricingCard";
import RentalReservationChargesCard from "@/components/admin/RentalReservationChargesCard";
import ProductPreviewCard from "@/components/admin/ProductPreviewCard";
import ProductActionsDrawer from "@/components/admin/ProductActionsDrawer";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import {
  getProductById,
  deleteProduct,
  duplicateProduct,
} from "@/services/productService";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  // Retrieve current product
  const product = useMemo(() => {
    return getProductById(productId);
  }, [productId]);

  // Handle Duplication
  const handleDuplicate = () => {
    if (!product) return;
    const duplicated = duplicateProduct(product.id);
    if (duplicated) {
      setNotice(`Product duplicated successfully as "${duplicated.name}"!`);
      setTimeout(() => {
        navigate(`/product/${duplicated.id}`);
      }, 700);
    }
  };

  // Handle Deletion Confirmation
  const handleDeleteConfirm = () => {
    if (!product) return;
    setIsDeleting(true);
    setTimeout(() => {
      deleteProduct(product.id);
      setIsDeleting(false);
      setDeleteModalOpen(false);
      navigate("/product");
    }, 400);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AdminNavbar activeTab="products" />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Product not found</h1>
          <p className="text-sm text-muted-foreground">
            The requested product with ID "{productId}" could not be located in the catalog.
          </p>
          <Link
            to="/product"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Products Catalog</span>
          </Link>
        </main>
      </div>
    );
  }

  const reservationCharges = product.reservationCharges || {
    extraHour: 100,
    extraDay: 300,
    additionalCharge: 200,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Admin Navbar */}
      <AdminNavbar activeTab="products" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Page Header with Breadcrumbs, Title with Draft Badge, and Action Drawer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <Link
                to="/product"
                className="hover:text-foreground transition-colors"
              >
                Products
              </Link>
              <ChevronRight className="size-3 text-muted-foreground/60" />
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {product.name}
              </span>
            </nav>

            {/* Product Name Heading with Draft Badge Beside It */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 px-2.5 py-0.5 text-[11px] font-medium">
                <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                Draft
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View complete product details including rental pricing and additional charges.
            </p>
          </div>

          {/* Top-Right Header Actions: Back to Products & Contextual Action Drawer */}
          <div className="flex items-center shrink-0 self-start sm:self-center">
            <ProductActionsDrawer
              product={product}
              onEdit={() => navigate(`/product/create?edit=${product.id}`)}
              onDuplicate={handleDuplicate}
              onDelete={() => setDeleteModalOpen(true)}
            />
          </div>
        </div>

        {/* Success Notice / Notification */}
        {notice && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* 3-Column Desktop Workspace (Matching Screenshot 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Column 1: Read-Only Product Information (Col-span-4) */}
          <div className="lg:col-span-4">
            <ProductInformationCard
              mode="display"
              product={product}
            />
          </div>

          {/* Column 2: Read-Only Rental Pricing & Reservation Charges (Col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            <RentalPricingCard
              mode="display"
              pricingRules={product.pricingRules || []}
            />

            <RentalReservationChargesCard
              mode="display"
              charges={reservationCharges}
            />
          </div>

          {/* Column 3: Product Preview (Col-span-3) */}
          <div className="lg:col-span-3">
            <ProductPreviewCard
              product={product}
              pricingRules={product.pricingRules || []}
              charges={reservationCharges}
              status="Draft"
              title="Product Preview"
              subtitle="See how this product will appear to customers."
            />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        productName={product.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
