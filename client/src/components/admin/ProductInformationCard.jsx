// client/src/components/admin/ProductInformationCard.jsx
import * as React from "react";
import { useState, useRef } from "react";
import {
  UploadCloud,
  Plus,
  X,
  SquarePen,
  ShieldCheck,
  LayoutGrid,
  Palette,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Select from "@/components/ui/select";
import { CATEGORIES, COLOR_OPTIONS } from "@/data/mockProducts";

function getColorHex(colorName = "") {
  const map = {
    Black: "#111827",
    Silver: "#9CA3AF",
    White: "#F3F4F6",
    Gray: "#6B7280",
    "Teal / Green": "#0D9488",
    Yellow: "#EAB308",
    Red: "#EF4444",
    Blue: "#3B82F6",
    Orange: "#F97316",
    Green: "#22C55E",
  };
  return map[colorName] || "#374151";
}

/**
 * Reusable Product Information Card
 * Supports mode="edit" (Create Product) and mode="display" (Product Detail)
 */
export function ProductInformationCard({
  mode = "display", // "display" | "edit"
  product = {},
  onChange,
  errors = {},
  className,
}) {
  const isEdit = mode === "edit";
  const fileInputRef = useRef(null);

  // Active image index for gallery
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Normalized images list
  const images = React.useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.imagePreview) {
      return [product.imagePreview];
    }
    if (product.image) {
      return [product.image];
    }
    return [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80",
    ];
  }, [product.images, product.image, product.imagePreview]);

  const totalImages = images.length;
  const currentImage = images[activeImageIdx % totalImages] || images[0];

  const handleFieldChange = (field, value) => {
    onChange?.({
      ...product,
      [field]: value,
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    const updatedImages = [...images, ...newUrls];
    onChange?.({
      ...product,
      images: updatedImages,
      image: updatedImages[0],
      imagePreview: updatedImages[0],
    });
  };

  const handleRemoveImage = (indexToRemove, e) => {
    e?.stopPropagation();
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange?.({
      ...product,
      images: updated,
      image: updated[0] || "",
      imagePreview: updated[0] || "",
    });
    if (activeImageIdx >= updated.length) {
      setActiveImageIdx(Math.max(0, updated.length - 1));
    }
  };

  const categoryOptions = CATEGORIES.filter((c) => c !== "All Categories");

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5",
        className
      )}
    >
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          Product Information
        </h3>
        {isEdit && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Basic details about your rental product.
          </p>
        )}
      </div>

      {isEdit ? (
        /* ======================== EDIT MODE ======================== */
        <div className="space-y-4">
          {/* Product Images Section */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Product Images
            </label>
            <div className="grid grid-cols-12 gap-3 items-start">
              {/* Left: Drag & Drop upload container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="col-span-12 sm:col-span-8 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 rounded-xl bg-muted/10 hover:bg-muted/20 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer text-center min-h-[140px]"
              >
                <div className="size-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-2xs">
                  <UploadCloud className="size-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  Drag & drop images here
                </p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  or click to browse
                </p>
                <span className="text-[10px] text-muted-foreground mt-1">
                  PNG, JPG or WEBP (Max 5MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Right: Stacked Thumbnails & Add more */}
              <div className="col-span-12 sm:col-span-4 flex flex-col gap-2">
                {/* Scrollable Thumbnails List (fits 3 thumbnails initially) */}
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto sm:max-h-[176px] p-1 sm:p-1.5 -m-1 sm:-m-1.5">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={cn(
                        "relative size-14 sm:w-full sm:h-12 rounded-lg border bg-muted/20 p-1 shrink-0 overflow-visible cursor-pointer transition-all",
                        activeImageIdx === idx
                          ? "border-2 border-indigo-600 shadow-2xs"
                          : "border-border/80 hover:border-border"
                      )}
                    >
                      <img
                        src={imgUrl}
                        alt={`Upload ${idx + 1}`}
                        className="size-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(idx, e)}
                        aria-label="Remove image"
                        className="absolute -top-1 -right-1 z-10 size-4 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black shadow-xs cursor-pointer"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add More button - Fixed below the scrollable thumbnail list */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-dashed border-border/80 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="size-3" />
                  <span>Add more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {product.name?.length || 0}/100
              </span>
            </div>
            <div className="relative flex items-center">
              <SquarePen className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
              <input
                type="text"
                maxLength={100}
                placeholder="Enter product name"
                value={product.name ?? ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={cn(
                  "h-9 w-full rounded-lg border bg-background dark:bg-input/30 pl-9 pr-3 text-xs sm:text-sm font-medium outline-none transition-colors",
                  "focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500",
                  errors.name
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-border/90"
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Enter a clear and descriptive product name.
            </p>
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>
            )}
          </div>

          {/* Base Price (Reference) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Base Price (Reference) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-xs font-medium text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="2,500"
                value={product.price === 0 && product.price !== "" ? 0 : product.price ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange("price", val === "" ? "" : parseFloat(val) || 0);
                }}
                className={cn(
                  "h-9 w-full rounded-lg border bg-background dark:bg-input/30 pl-8 pr-3 text-xs sm:text-sm font-medium outline-none transition-colors",
                  "focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500",
                  errors.price
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-border/90"
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Base price for reference (e.g. purchase or market price).
            </p>
            {errors.price && (
              <p className="text-[11px] text-rose-500 mt-0.5">{errors.price}</p>
            )}
          </div>

          {/* Category & Color 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Select
                  value={product.category || "Cameras & Accessories"}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                  options={categoryOptions}
                  placeholder="Select category"
                />
              </div>
            </div>

            {/* Color Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Color <span className="text-rose-500">*</span>
              </label>
              <Select
                value={product.color || "Black"}
                onChange={(e) => handleFieldChange("color", e.target.value)}
                options={COLOR_OPTIONS}
                placeholder="Select color"
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Product Description
              </label>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Provide a detailed description of the product..."
              value={product.description ?? ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="w-full rounded-lg border border-border/90 bg-background dark:bg-input/30 p-2.5 text-xs sm:text-sm font-medium outline-none transition-colors focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none"
            />
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground">
                {product.description?.length || 0}/500
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== DISPLAY (READ-ONLY) MODE ======================== */
        <div className="space-y-5">
          {/* Large Image Carousel */}
          <div className="relative aspect-[4/3] w-full rounded-xl bg-muted/20 border border-border/60 overflow-hidden flex items-center justify-center">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.name}
                className="size-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="size-10 stroke-[1.5]" />
                <span className="text-xs mt-1">No Image</span>
              </div>
            )}

            {/* Left/Right buttons */}
            {totalImages > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveImageIdx((p) => (p > 0 ? p - 1 : totalImages - 1))
                }
                aria-label="Previous image"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-card"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            {totalImages > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveImageIdx((p) => (p < totalImages - 1 ? p + 1 : 0))
                }
                aria-label="Next image"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-card"
              >
                <ChevronRight className="size-4" />
              </button>
            )}

            {/* Position indicator + Fullscreen button */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 z-10">
              <span className="rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[11px] font-semibold text-white tracking-wide">
                {(activeImageIdx % totalImages) + 1}/{totalImages}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="Expand view"
                className="size-6 rounded-md bg-white/90 dark:bg-card/90 text-foreground shadow-xs flex items-center justify-center"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 4 Thumbnails in a Horizontal Strip matching Screenshot 2 */}
          <div className="grid grid-cols-4 gap-2.5">
            {images.slice(0, 4).map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={cn(
                  "relative aspect-square rounded-lg border bg-muted/10 p-1 overflow-hidden transition-all",
                  activeImageIdx === idx
                    ? "border-2 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "border-border/80 hover:border-border"
                )}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="size-full object-contain"
                />
              </button>
            ))}
          </div>

          {/* Read-Only Spec Rows with Icons */}
          <div className="pt-2 border-t border-border/60 space-y-3.5">
            {/* Product Name */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <SquarePen className="size-3.5 shrink-0" />
                <span>Product Name</span>
              </div>
              <span className="font-semibold text-foreground text-right">
                {product.name || "—"}
              </span>
            </div>

            {/* Base Price (Reference) */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <ShieldCheck className="size-3.5 shrink-0" />
                <span>Base Price (Reference)</span>
              </div>
              <span className="font-bold text-foreground text-right">
                ₹ {Number(product.price || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <LayoutGrid className="size-3.5 shrink-0" />
                <span>Category</span>
              </div>
              <span className="font-medium text-foreground text-right">
                {product.category || "Cameras & Accessories"}
              </span>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Palette className="size-3.5 shrink-0" />
                <span>Color</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span
                  className="size-3 rounded-full border border-border/80 shrink-0"
                  style={{ backgroundColor: getColorHex(product.color) }}
                />
                <span>{product.color || "Black"}</span>
              </div>
            </div>

            {/* Product Description */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <FileText className="size-3.5 shrink-0" />
                <span>Product Description</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                {product.description ||
                  "High-performance full-frame mirrorless camera with 20.1MP sensor, 4K video recording and advanced autofocus. Ideal for professional photography and videography."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for display mode */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full bg-card rounded-2xl p-4 overflow-hidden border border-border shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="w-full flex-1 flex items-center justify-center min-h-[350px]">
              <img
                src={currentImage}
                alt={product.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                Image {(activeImageIdx % totalImages) + 1} of {totalImages}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductInformationCard;
