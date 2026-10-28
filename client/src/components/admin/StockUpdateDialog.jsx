// client/src/components/admin/StockUpdateDialog.jsx
import * as React from "react";
import { useState } from "react";
import { Boxes, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Controlled Stock Update Dialog
 * Provides an honest demonstration interaction without claiming backend persistence.
 */
export function StockUpdateDialog({
  isOpen,
  onClose,
  productName,
  currentStock = 12,
  onUpdateSuccess,
}) {
  const [quantity, setQuantity] = useState(currentStock);
  const [feedback, setFeedback] = useState("");

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setFeedback(`Stock quantity simulated to ${quantity} units (Demonstration mode).`);
    setTimeout(() => {
      onUpdateSuccess?.(quantity);
      setFeedback("");
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in-50"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Boxes className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Update Stock Inventory
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Adjust available inventory units for:
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {productName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Available Units
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-9 w-full rounded-lg border border-input bg-background dark:bg-input/30 px-3 py-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex gap-2 items-start">
            <AlertCircle className="size-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Note: This is an administrative preview. Stock counts are maintained via the Rental Warehouse & Orders service.
            </span>
          </div>

          {feedback && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2 text-xs font-medium">
              {feedback}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Apply Change
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockUpdateDialog;
