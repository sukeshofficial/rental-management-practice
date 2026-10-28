// client/src/components/admin/ProductActionsDrawer.jsx
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Pencil,
  Copy,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animated Settings Action Drawer for Product Detail Header
 * Sits directly beside "Back to Products".
 * When closed: Displays [Back to Products] and [Settings Gear].
 * When open: The gear rotates as the contextual action drawer expands smoothly toward the left,
 * revealing:
 * - Edit Product
 * - Duplicate
 * - Delete Product
 * All actions are clearly visible, unclipped, and fully clickable.
 */
export function ProductActionsDrawer({
  product,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleEditClick = () => {
    setIsOpen(false);
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/product/create?edit=${product?.id}`, { state: { product } });
    }
  };

  const handleDuplicateClick = () => {
    setIsOpen(false);
    onDuplicate?.();
  };

  const handleDeleteClick = () => {
    setIsOpen(false);
    onDelete?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center gap-3", className)}
    >
      {/* Back to Products Button */}
      <button
        type="button"
        onClick={() => navigate("/product")}
        className="relative z-20 inline-flex items-center gap-1.5 rounded-xl border border-border/90 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shrink-0"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Products</span>
      </button>

      {/* Settings Gear & Contextual Action Drawer Pill Container */}
      <div
        className={cn(
          "relative flex items-center rounded-xl transition-all duration-300 ease-out shadow-2xs",
          isOpen
            ? "border border-border/90 bg-card p-1"
            : "border border-transparent bg-transparent"
        )}
      >
        {/* Animated Drawer expanding horizontally to the LEFT */}
        <div
          id="product-actions-drawer"
          role="region"
          aria-label="Product Actions"
          className={cn(
            "flex items-center transition-all duration-300 ease-out overflow-hidden whitespace-nowrap",
            isOpen
              ? "max-w-[420px] opacity-100 pr-2 pl-1"
              : "max-w-0 opacity-0 pr-0 pl-0 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Action 1: Edit Product */}
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 font-medium transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5 text-blue-500" />
              <span>Edit Product</span>
            </button>

            <span className="h-4 w-px bg-border/60" />

            {/* Action 2: Duplicate */}
            <button
              type="button"
              onClick={handleDuplicateClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 font-medium transition-colors cursor-pointer"
            >
              <Copy className="size-3.5 text-muted-foreground" />
              <span>Duplicate</span>
            </button>

            <span className="h-4 w-px bg-border/60" />

            {/* Action 3: Delete Product */}
            <button
              type="button"
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5 text-rose-500" />
              <span>Delete Product</span>
            </button>
          </div>
        </div>

        {/* Settings Gear Button - Smoothly rotates on toggle */}
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label="Product actions"
          aria-expanded={isOpen}
          aria-controls="product-actions-drawer"
          className={cn(
            "relative z-20 flex size-9 items-center justify-center rounded-lg border transition-all duration-300 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shrink-0",
            isOpen
              ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
              : "border-border/90 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          <Settings
            className={cn(
              "size-4 transition-transform duration-300 ease-out",
              isOpen ? "rotate-90 text-blue-600 dark:text-blue-400" : "rotate-0"
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default ProductActionsDrawer;
