// client/src/components/admin/ProductCard.jsx
import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, MoreVertical, Pencil, Copy, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable Product Card matching Reference Image 3:
 * - 4:3 or square product image with clean containment/cover and subtle gray container
 * - 3-dots more menu at top right (without triggering card navigation)
 * - Category subtitle
 * - Product name in bold
 * - Base price formatted (e.g. ₹ 2,500)
 * - Base price helper caption
 * - Status badge (Active: green dot; Draft / Archived: blue/gray dot)
 */
export function ProductCard({
  product,
  onEdit,
  onDuplicate,
  onArchive,
  className,
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!product) return null;

  const {
    id,
    name,
    category,
    price,
    basePrice,
    image,
    status = "active",
    currency = "INR",
  } = product;

  const resolvedPrice = typeof basePrice === "number" ? basePrice : Number(price) || 0;
  const formattedPrice = `₹ ${resolvedPrice.toLocaleString("en-IN")}`;

  const isActive = status?.toLowerCase() === "active";
  const isDraft = status?.toLowerCase() === "draft";

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View details for ${name}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all duration-200",
        "hover:border-blue-400/80 dark:hover:border-blue-600/80 hover:shadow-md cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className
      )}
    >
      {/* Product Image Area */}
      <div className="relative aspect-4/3 w-full bg-neutral-50 dark:bg-neutral-900/40 border-b border-border/60 flex items-center justify-center p-5 overflow-hidden">
        {/* Context Menu Button */}
        <div
          className="absolute top-2.5 right-2.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={`Options for ${name}`}
            className="flex size-7 items-center justify-center rounded-lg bg-card/80 backdrop-blur-xs text-muted-foreground hover:text-foreground hover:bg-card border border-border/60 shadow-2xs transition-colors"
          >
            <MoreVertical className="size-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 rounded-xl border border-border bg-card p-1 shadow-lg z-30 animate-in fade-in-50 zoom-in-95 text-xs">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(product);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-muted"
                  >
                    <Pencil className="size-3.5 text-blue-500" />
                    <span>Edit</span>
                  </button>
                )}
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(product);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-foreground hover:bg-muted"
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>Duplicate</span>
                  </button>
                )}
                {onArchive && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(product);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Archive className="size-3.5 text-rose-500" />
                    <span>Archive</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Product Image or Fallback */}
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            onError={() => setImageError(true)}
            className="size-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Package className="size-6 stroke-[1.5]" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/80 line-clamp-1">
              {category || "Rental Item"}
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
            {category || "General"}
          </p>
          <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              {formattedPrice}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Base price</p>
        </div>

        {/* Status Badge */}
        <div className="pt-1">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-blue-500" />
              {isDraft ? "Draft" : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
