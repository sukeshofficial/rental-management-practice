// client/src/components/admin/ProductInfoSection.jsx
import * as React from "react";
import { useState } from "react";
import { Camera, Package, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import Select from "@/components/ui/select";
import { CATEGORIES, COLOR_OPTIONS } from "@/data/mockProducts";

/**
 * Reusable Product Info Section
 * Supports both display mode (Product Detail) and edit/creation mode (Create Product).
 */
export function ProductInfoSection({
  mode = "display", // "display" | "edit"
  product = {},
  onChange,
  errors = {},
  categoryOptions = CATEGORIES.filter((c) => c !== "All Categories"),
  colorOptions = COLOR_OPTIONS,
  className,
}) {
  const isEdit = mode === "edit";
  const [imageFailed, setImageFailed] = useState(false);

  const handleFieldChange = (field, value) => {
    onChange?.({
      ...product,
      [field]: value,
    });
  };

  const formattedPrice =
    typeof product.price === "number"
      ? `₹ ${product.price.toLocaleString("en-IN")}`
      : product.price
      ? `₹ ${product.price}`
      : "₹ 0";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">
        General Product Info
      </h3>

      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Left: Product Image Display or Upload Area */}
        <div className="shrink-0 w-full sm:w-44 md:w-48">
          {isEdit ? (
            <label
              htmlFor="product-image-upload"
              className={cn(
                "relative flex flex-col items-center justify-center aspect-square w-full rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-4 text-center cursor-pointer transition-all",
                "hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20",
                "focus-within:ring-2 focus-within:ring-indigo-500"
              )}
            >
              {product.imagePreview || (product.image && !imageFailed) ? (
                <div className="relative size-full flex items-center justify-center">
                  <img
                    src={product.imagePreview || product.image}
                    alt="Preview"
                    onError={() => setImageFailed(true)}
                    className="size-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    Change Image
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Camera className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Upload Product Image
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      PNG, JPG or WEBP (Max 5MB)
                    </span>
                  </div>
                </div>
              )}
              <input
                id="product-image-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    handleFieldChange("imagePreview", previewUrl);
                    handleFieldChange("image", previewUrl);
                  }
                }}
              />
            </label>
          ) : (
            <div className="aspect-square w-full rounded-xl border border-border/80 bg-muted/20 p-4 flex items-center justify-center overflow-hidden">
              {product.image && !imageFailed ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onError={() => setImageFailed(true)}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="size-10 stroke-[1.5]" />
                  <span className="text-[11px] mt-1 text-muted-foreground/80">
                    No image asset
                  </span>
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Or paste image URL"
                value={product.image || ""}
                onChange={(e) => handleFieldChange("image", e.target.value)}
                className="w-full text-[11px] text-muted-foreground bg-transparent border border-border/70 rounded-md px-2 py-1 outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Right: Product Detail Fields / Inputs */}
        <div className="flex-1 w-full space-y-3.5">
          {/* Field 1: Product Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Product Name {isEdit && <span className="text-destructive">*</span>}
            </label>
            {isEdit ? (
              <div>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={product.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-background dark:bg-input/30 px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors outline-none",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                    errors.name && "border-destructive ring-1 ring-destructive"
                  )}
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive mt-1">{errors.name}</p>
                )}
              </div>
            ) : (
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {product.name || "—"}
              </p>
            )}
          </div>

          {/* Field 2: Base Price */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Price {isEdit && <span className="text-destructive">*</span>}
            </label>
            {isEdit ? (
              <div>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-2.5 text-xs text-muted-foreground font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={product.price === 0 && product.price !== "" ? 0 : product.price ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange("price", val === "" ? "" : parseFloat(val) || 0);
                    }}
                    className={cn(
                      "h-8 w-full rounded-lg border border-input bg-background dark:bg-input/30 pl-7 pr-2.5 py-1 text-xs sm:text-sm font-medium transition-colors outline-none",
                      "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                      errors.price && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </div>
                {errors.price && (
                  <p className="text-[11px] text-destructive mt-1">{errors.price}</p>
                )}
              </div>
            ) : (
              <p className="text-sm sm:text-base font-bold text-foreground">
                {formattedPrice}
              </p>
            )}
          </div>

          {/* Field 3: Category */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Category
            </label>
            {isEdit ? (
              <Select
                value={product.category || ""}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                options={categoryOptions}
                placeholder="Select category"
              />
            ) : (
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {product.category || "General"}
              </p>
            )}
          </div>

          {/* Field 4: Color */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Color
            </label>
            {isEdit ? (
              <Select
                value={product.color || ""}
                onChange={(e) => handleFieldChange("color", e.target.value)}
                options={colorOptions}
                placeholder="Select color"
              />
            ) : (
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {product.color || "Standard"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInfoSection;
