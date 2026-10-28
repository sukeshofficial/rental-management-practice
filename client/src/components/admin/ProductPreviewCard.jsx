// client/src/components/admin/ProductPreviewCard.jsx
import * as React from "react";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  LayoutGrid,
  X,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to map color names to CSS colors
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
 * Reusable Product Preview Card
 * Displays real-time preview of the rental product matching reference UI
 */
export function ProductPreviewCard({
  product = {},
  pricingRules = [],
  charges = {},
  status = "Draft",
  title = "Product preview",
  subtitle = "See how your product will appear to customers.",
  className,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalize image list
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
    return [];
  }, [product.images, product.image, product.imagePreview]);

  const totalImages = images.length;
  const currentImage = images[activeImageIndex % totalImages] || images[0] || null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (totalImages <= 1) return;
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (totalImages <= 1) return;
    setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  // Format currency
  const formatINR = (val) => {
    if (val === "" || val === undefined || val === null) return "0";
    const num = Number(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-IN");
  };

  const productName = product.name?.trim() || "Product Name";
  const basePrice =
    product.price !== undefined && product.price !== ""
      ? formatINR(product.price)
      : "0";
  const categoryName = product.category || "Select category";
  const colorName = product.color || "Standard";
  const descriptionText =
    product.description || "Enter product description...";

  return (
    <>
      {/* Preview Card Container - Top edge aligns directly with Column 1 & 2 */}
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4",
          className
        )}
      >
        {/* Card Header inside the container */}
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Carousel Image Container */}
        <div className="relative aspect-[4/3] w-full rounded-xl bg-muted/20 border border-border/60 overflow-hidden flex items-center justify-center group">
          {currentImage && !imgError ? (
            <img
              src={currentImage}
              alt={productName}
              onError={() => setImgError(true)}
              className="size-full object-contain p-2 transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-6">
              <Package className="size-10 stroke-[1.5]" />
              <span className="text-[11px] mt-1">Image Preview</span>
            </div>
          )}

          {/* Left Arrow Button */}
          {totalImages > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-md hover:bg-white dark:hover:bg-card flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          {/* Right Arrow Button */}
          {totalImages > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-md hover:bg-white dark:hover:bg-card flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ChevronRight className="size-4" />
            </button>
          )}

          {/* Position Indicator Badge + Fullscreen Button */}
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 z-10">
            <span className="rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[11px] font-semibold text-white tracking-wide">
              {(activeImageIndex % totalImages) + 1}/{totalImages}
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="Expand image"
              className="size-6 rounded-md bg-white/90 dark:bg-card/90 text-foreground shadow-xs hover:bg-white dark:hover:bg-card flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Product Title and Draft Badge Row */}
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
            {productName}
          </h4>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 px-2.5 py-0.5 text-[11px] font-medium shrink-0">
            <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            {status}
          </span>
        </div>

        {/* Base Price in Rupees */}
        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
          ₹ {basePrice}
        </div>

        {/* Category & Color Meta */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LayoutGrid className="size-3.5 shrink-0" />
            <span>{categoryName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <span
              className="size-3 rounded-full border border-border/80 shadow-2xs shrink-0"
              style={{ backgroundColor: getColorHex(colorName) }}
            />
            <span>{colorName}</span>
          </div>
        </div>

        {/* Description Paragraph */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {descriptionText}
        </p>

        {/* Rental Pricing Summary List */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <h5 className="text-xs font-semibold text-foreground tracking-tight">
            Rental Pricing
          </h5>
          <div className="space-y-1.5 text-xs">
            {Array.isArray(pricingRules) && pricingRules.length > 0 ? (
              pricingRules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="flex items-center justify-between text-muted-foreground"
                >
                  <span>{rule.duration}</span>
                  <span className="font-semibold text-foreground">
                    ₹ {formatINR(rule.price)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-muted-foreground">
                No custom pricing rules defined.
              </p>
            )}
          </div>
        </div>

        {/* Additional Charges Summary List */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <h5 className="text-xs font-semibold text-foreground tracking-tight">
            Additional Charges
          </h5>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Extra Hour</span>
              <span className="font-semibold text-foreground">
                ₹ {formatINR(charges?.extraHour ?? 100)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Extra Day</span>
              <span className="font-semibold text-foreground">
                ₹ {formatINR(charges?.extraDay ?? 300)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Additional Charge</span>
              <span className="font-semibold text-foreground">
                ₹ {formatINR(charges?.additionalCharge ?? 200)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full bg-card rounded-2xl p-4 overflow-hidden border border-border shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="w-full flex-1 flex items-center justify-center min-h-[350px]">
              <img
                src={currentImage}
                alt={productName}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-foreground">{productName}</p>
              <p className="text-xs text-muted-foreground">
                Image {(activeImageIndex % totalImages) + 1} of {totalImages}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductPreviewCard;
