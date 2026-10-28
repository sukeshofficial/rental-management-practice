// client/src/components/admin/DeleteConfirmModal.jsx
import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible confirmation dialog for deleting a product
 */
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName = "this product",
  isDeleting = false,
}) {
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="delete-dialog-title"
              className="text-base font-semibold text-foreground tracking-tight"
            >
              Delete Product
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">"{productName}"</strong>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
