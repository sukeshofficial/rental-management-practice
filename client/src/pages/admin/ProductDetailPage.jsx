// client/src/pages/admin/ProductDetailPage.jsx
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronRight,
  ArrowLeft,
  Package,
  Pencil,
  Copy,
  Archive,
  MoreVertical,
  ChevronDown,
  Info,
  Maximize2,
  ChevronLeft as GalleryPrev,
  ChevronRight as GalleryNext,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Camera,
  Cpu,
  Video,
  Scale,
  Disc,
} from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import {
  fetchProductById,
  fetchProducts,
  archiveProduct,
  selectSelectedProduct,
  selectProducts,
  selectIsFetchingDetails,
  selectDetailsError,
  selectIsMutating,
} from "@/redux/Slices/productsSlice";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const product = useSelector(selectSelectedProduct);
  const allProducts = useSelector(selectProducts);
  const isLoading = useSelector(selectIsFetchingDetails);
  const error = useSelector(selectDetailsError);
  const isMutating = useSelector(selectIsMutating);

  // Gallery active index state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Accordion collapsed/expanded states (matching Reference 1)
  const [rentalPricingOpen, setRentalPricingOpen] = useState(true);
  const [additionalChargesOpen, setAdditionalChargesOpen] = useState(true);
  const [productDetailsOpen, setProductDetailsOpen] = useState(true);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  // Actions dropdown menu state
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Fetch product on mount or route param change
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
      setSelectedImageIndex(0);
    }
  }, [productId, dispatch]);

  // Also ensure catalog list is loaded for related products
  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts({ limit: 12 }));
    }
  }, [allProducts.length, dispatch]);

  // Gallery images array
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((img) => (typeof img === "string" ? img : img.url)).filter(Boolean);
    }
    if (product.image) return [product.image];
    return [];
  }, [product]);

  // Next / Prev image navigation
  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Related products (same category excluding current product)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [allProducts, product]);

  // RBAC checks
  const isAdmin = user?.isAdmin === true || user?.role === "admin";
  const canEdit =
    isAdmin ||
    user?.role === "internal_staff" ||
    (Array.isArray(user?.permissions) &&
      (user.permissions.includes("inventory.manage") || user.permissions.includes("*")));

  // Duplicate handler
  const handleDuplicate = () => {
    if (!product) return;
    navigate("/product/create", {
      state: {
        product: {
          ...product,
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-COPY`,
        },
      },
    });
  };

  // Archive handler
  const handleArchive = async () => {
    if (!product) return;
    if (window.confirm(`Are you sure you want to archive "${product.name}"?`)) {
      await dispatch(archiveProduct(product.id));
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    return `₹ ${val.toLocaleString("en-IN")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AdminNavbar activeTab="products" />
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-xs text-muted-foreground">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <AdminNavbar activeTab="products" />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="size-7" />
          </div>
          <h1 className="text-xl font-bold">Product not found</h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {error || `The requested product "${productId}" could not be retrieved from the catalog.`}
          </p>
          <Link
            to="/product"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Products</span>
          </Link>
        </main>
      </div>
    );
  }

  const {
    name,
    category,
    color,
    sku,
    status = "active",
    basePrice,
    rentalPricing = [],
    reservationCharges = {},
    description,
  } = product;

  const currentPrimaryImage = galleryImages[selectedImageIndex] || galleryImages[0] || null;
  const isDraft = status?.toLowerCase() === "draft";
  const isActive = status?.toLowerCase() === "active";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AdminNavbar activeTab="products" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Header Section (Matching Reference Image 1) */}
        <div className="space-y-1.5">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Link to="/product" className="hover:text-foreground transition-colors">
              Products
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{name}</span>
          </nav>

          {/* Heading Row: Title + Status Badge + Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {name}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isActive ? "bg-emerald-500" : "bg-blue-500"
                    )}
                  />
                  {isActive ? "Active" : isDraft ? "Draft" : status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
            </div>

            {/* Top Right Actions: Back to Products, More Actions, Edit Product */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => navigate("/product")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Products</span>
              </button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                  aria-label="More actions"
                  className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted shadow-2xs transition-colors cursor-pointer"
                >
                  <MoreVertical className="size-3.5" />
                </button>

                {moreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMoreMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-lg z-40 text-xs animate-in fade-in-50 zoom-in-95">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            handleDuplicate();
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-muted cursor-pointer"
                        >
                          <Copy className="size-3.5 text-muted-foreground" />
                          <span>Duplicate Product</span>
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            handleArchive();
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Archive className="size-3.5 text-rose-500" />
                          <span>Archive Product</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => navigate(`/product/create?edit=${product.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  <span>Edit Product</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Desktop Grid Layout (Reference Image 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ──────────────── COLUMN 1: Product Gallery (Col-span-4) ──────────────── */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative rounded-2xl border border-border/80 bg-neutral-50 dark:bg-neutral-900/40 overflow-hidden p-6 aspect-square flex items-center justify-center group shadow-2xs">
              {currentPrimaryImage ? (
                <img
                  src={currentPrimaryImage}
                  alt={name}
                  className="size-full object-contain object-center transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="size-16 stroke-[1.2]" />
                  <span className="text-xs mt-2">No image available</span>
                </div>
              )}

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-card/90 backdrop-blur-xs text-foreground shadow-sm border border-border/70 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <GalleryPrev className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-card/90 backdrop-blur-xs text-foreground shadow-sm border border-border/70 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <GalleryNext className="size-4" />
                  </button>
                </>
              )}

              {/* Lightbox / Expand icon button */}
              {currentPrimaryImage && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Expand image"
                  className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur-xs text-muted-foreground hover:text-foreground shadow-2xs border border-border/70 transition-colors cursor-pointer"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {galleryImages.slice(0, 4).map((url, idx) => {
                  const isSelected = selectedImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={cn(
                        "relative size-16 sm:size-18 rounded-xl border overflow-hidden p-1 bg-neutral-50 dark:bg-neutral-900/40 shrink-0 transition-all cursor-pointer",
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-500/30"
                          : "border-border/80 hover:border-border"
                      )}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="size-full object-contain" />
                    </button>
                  );
                })}

                {/* More indicator if > 4 images */}
                {galleryImages.length > 4 && (
                  <div className="size-16 sm:size-18 rounded-xl border border-border/80 bg-card flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                    +{galleryImages.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ───────────── COLUMN 2: Product Information Panels (Col-span-5) ───────────── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Overview Panel (Matching Reference Image 1) */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Overview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Essential details about this product.
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => navigate(`/product/create?edit=${product.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3 text-muted-foreground" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-border/60 text-xs">
                {/* Base Price (Reference) */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">Base Price (Reference)</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-bold text-blue-600 text-sm sm:text-base">
                      <span>{formatCurrency(basePrice)}</span>
                      <Info className="size-3.5 text-muted-foreground/70" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Reference purchase price. Not a rental rate.</p>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-semibold text-foreground">{category}</span>
                </div>

                {/* Color */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Color</span>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-neutral-900 dark:bg-white" />
                    <span className="font-semibold text-foreground">{color || "Standard"}</span>
                  </div>
                </div>

                {/* SKU */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-semibold font-mono text-foreground">{sku || "N/A"}</span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[11px] font-medium">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    {isActive ? "Active" : isDraft ? "Draft" : status}
                  </span>
                </div>
              </div>
            </div>

            {/* Accordion 1: Rental Pricing (Collapsible) */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setRentalPricingOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                aria-expanded={rentalPricingOpen}
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">Rental Pricing</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Rental rates for different durations.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{rentalPricing.length} plans</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      rentalPricingOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </button>

              {rentalPricingOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-border/60 pt-3">
                  {rentalPricing.length > 0 ? (
                    <div className="divide-y divide-border/60 text-xs">
                      {rentalPricing.map((rule, idx) => (
                        <div key={rule.id || idx} className="flex items-center justify-between py-2.5">
                          <div>
                            <p className="font-semibold text-foreground">{rule.duration}</p>
                            <p className="text-[11px] text-muted-foreground">{rule.pricelist} Tier</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-foreground">{formatCurrency(rule.price)}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">No custom rental rates set for this item.</p>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Additional Charges (Collapsible) */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setAdditionalChargesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                aria-expanded={additionalChargesOpen}
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">Additional Charges</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Extra charges for extended usage or special cases.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">3 charges</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      additionalChargesOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </button>

              {additionalChargesOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-border/60 pt-3 text-xs divide-y divide-border/60">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Extra Hour Charge</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(reservationCharges.extraHour)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Extra Day Charge</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(reservationCharges.extraDay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Additional / Security Charge</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(reservationCharges.additionalCharge)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Product Details (Collapsible) */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setProductDetailsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                aria-expanded={productDetailsOpen}
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">Product Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Detailed specifications and features.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Specifications</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      productDetailsOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </button>

              {productDetailsOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-border/60 pt-3 text-xs divide-y divide-border/60">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Product Category</span>
                    <span className="font-semibold text-foreground">{category}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Rental Availability</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {product.isRentable !== false ? "Available for Rent" : "Catalog Only"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Inventory Units (Catalog)</span>
                    <span className="font-semibold text-foreground">{product.stock || 12} units</span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Description (Collapsible) */}
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setDescriptionOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                aria-expanded={descriptionOpen}
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">Description</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Product overview, usage and other information.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{descriptionOpen ? "Open" : "Closed"}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      descriptionOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </button>

              {descriptionOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                  {description || "No extended product description has been written for this item."}
                </div>
              )}
            </div>
          </div>

          {/* ───────────── COLUMN 3: Right Side Panel Actions & Specs (Col-span-3) ───────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Primary Action Button 1: Preview Customer View */}
            <button
              type="button"
              onClick={() => alert(`Previewing customer listing for: ${name}`)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ExternalLink className="size-4" />
              <span>Preview Customer View</span>
            </button>

            {/* Secondary Action Button 2: Duplicate Product */}
            {canEdit && (
              <button
                type="button"
                onClick={handleDuplicate}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
              >
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Duplicate Product</span>
              </button>
            )}

            {/* Product Specifications Table Panel (Matching Reference 1 Right Card) */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Specifications
              </h3>

              <div className="divide-y divide-border/60 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Camera className="size-3 text-muted-foreground" />
                    <span>Brand</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {name.split(" ")[0] || "Standard"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="size-3 text-muted-foreground" />
                    <span>Model</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {name.split(" ").slice(1).join(" ") || "General"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3 text-muted-foreground" />
                    <span>Category</span>
                  </span>
                  <span className="font-semibold text-foreground">{category}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="size-3 text-muted-foreground" />
                    <span>Type</span>
                  </span>
                  <span className="font-semibold text-foreground">Rental Equipment</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Scale className="size-3 text-muted-foreground" />
                    <span>SKU</span>
                  </span>
                  <span className="font-semibold font-mono text-foreground">{sku || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────── Bottom Section: Related Products (Matching Reference 1) ───────────── */}
        {relatedProducts.length > 0 && (
          <div className="pt-6 border-t border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Related Products</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Other products in the same category.
                </p>
              </div>
              <Link
                to="/product"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Related products 4-column desktop cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/product/${rel.id}`)}
                  className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-4/3 bg-neutral-50 dark:bg-neutral-900/40 border-b border-border/60 p-4 flex items-center justify-center overflow-hidden">
                    {rel.image ? (
                      <img
                        src={rel.image}
                        alt={rel.name}
                        className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{rel.category}</p>
                      <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {rel.name}
                      </h4>
                    </div>
                    <div className="pt-1">
                      <p className="font-bold text-xs sm:text-sm text-foreground">
                        {formatCurrency(rel.basePrice)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Base price</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && currentPrimaryImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img
              src={currentPrimaryImage}
              alt={name}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
