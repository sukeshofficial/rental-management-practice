// client/src/components/admin/ProductPricingRow.jsx
import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Select from "@/components/ui/select";
import { DURATION_OPTIONS, PRICELIST_OPTIONS } from "@/data/mockProducts";

/**
 * Reusable Product Pricing Row
 * Used in both Product Detail (read-only or editable) and Create Product (editable builder).
 */
export function ProductPricingRow({
  id,
  duration = "1 Day",
  pricelist = "Standard",
  price = 0,
  isEditable = true,
  durationOptions = DURATION_OPTIONS,
  pricelistOptions = PRICELIST_OPTIONS,
  onChange,
  onRemove,
  canRemove = false,
  error,
  className,
}) {
  const handleDurationChange = (e) => {
    onChange?.({ id, duration: e.target.value, pricelist, price });
  };

  const handlePricelistChange = (e) => {
    onChange?.({ id, duration, pricelist: e.target.value, price });
  };

  const handlePriceChange = (e) => {
    const rawVal = e.target.value;
    // Allow empty during typing or positive numeric
    if (rawVal === "") {
      onChange?.({ id, duration, pricelist, price: "" });
      return;
    }
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num >= 0) {
      onChange?.({ id, duration, pricelist, price: num });
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-2 sm:gap-3 items-center py-2 border-b border-border/50 last:border-b-0",
        className
      )}
    >
      {/* Duration Column (col-span-4) */}
      <div className="col-span-4">
        {isEditable ? (
          <Select
            value={duration}
            onChange={handleDurationChange}
            options={durationOptions}
            size="sm"
            aria-label="Rental Duration"
          />
        ) : (
          <div className="text-xs sm:text-sm font-medium text-foreground py-1 px-1">
            {duration}
          </div>
        )}
      </div>

      {/* Pricelist Column (col-span-4) */}
      <div className="col-span-4">
        {isEditable ? (
          <Select
            value={pricelist}
            onChange={handlePricelistChange}
            options={pricelistOptions}
            size="sm"
            aria-label="Pricelist Type"
          />
        ) : (
          <div className="text-xs sm:text-sm font-medium text-foreground py-1 px-1">
            {pricelist}
          </div>
        )}
      </div>

      {/* Price Column (col-span-4 or col-span-3 + remove button) */}
      <div className={cn(canRemove ? "col-span-3" : "col-span-4")}>
        {isEditable ? (
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-2 text-xs text-muted-foreground font-medium">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={price === 0 && price !== "" ? 0 : price}
              onChange={handlePriceChange}
              placeholder="0.00"
              aria-label="Rental Price"
              className={cn(
                "h-7 w-full rounded-lg border border-input bg-background dark:bg-input/30 pl-5 pr-2 text-xs sm:text-sm font-medium transition-colors outline-none",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                error && "border-destructive ring-1 ring-destructive"
              )}
            />
          </div>
        ) : (
          <div className="text-xs sm:text-sm font-semibold text-foreground py-1 px-1">
            ₹ {Number(price || 0).toLocaleString("en-IN")}
          </div>
        )}
      </div>

      {/* Optional Remove row button */}
      {canRemove && isEditable && (
        <div className="col-span-1 flex justify-end">
          <button
            type="button"
            onClick={() => onRemove?.(id)}
            aria-label="Remove pricing rule"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductPricingRow;
