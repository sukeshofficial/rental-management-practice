// client/src/components/admin/ProductCard.jsx
import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable Product Card
 * Strictly contains:
 * 1. Product image (with clean graceful fallback for template hrefs)
 * 2. Product name
 * 3. Product price
 * EXPLICITLY NO shopping buttons (Add to Cart / Favorite).
 */
export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  to,
  onClick,
  className,
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      const destination = to || `/product/${id}`;
      navigate(destination);
    }
  };

  const formattedPrice =
    typeof price === "number"
      ? `₹ ${price.toLocaleString("en-IN")}`
      : `₹ ${price}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      aria-label={`View details for ${name}`}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all duration-200",
        "hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className
      )}
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 sm:aspect-square w-full bg-muted/30 border-b border-border/60 flex items-center justify-center p-4 overflow-hidden">
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
            <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <Package className="size-6 stroke-[1.5]" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/80 line-clamp-1">
              {category || "Rental Item"}
            </span>
          </div>
        )}
      </div>

      {/* Product Content: Name & Price */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-1.5">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {name}
        </h3>
        <p className="font-bold text-sm text-foreground tracking-tight">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
}

export default ProductCard;
