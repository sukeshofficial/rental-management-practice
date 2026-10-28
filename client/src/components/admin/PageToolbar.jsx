// client/src/components/admin/PageToolbar.jsx
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable Product Action Toolbar
 * Sits directly below the navbar on Product Detail and Create Product pages.
 */
export function PageToolbar({
  title,
  showCreateButton = true,
  createLabel = "Create",
  createTo = "/product/create",
  onCreateClick,
  showSettings = false,
  onSettingsClick,
  recordIndex,
  totalRecords,
  onPrevRecord,
  onNextRecord,
  actions,
  className,
}) {
  const navigate = useNavigate();

  const handleCreate = (e) => {
    if (onCreateClick) {
      e.preventDefault();
      onCreateClick();
    } else if (createTo) {
      navigate(createTo);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-background/50 py-3",
        className
      )}
    >
      {/* Left section: Create button + Title + Settings */}
      <div className="flex items-center gap-3">
        {showCreateButton && (
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/90 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>{createLabel}</span>
          </button>
        )}

        {title && (
          <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            {title}
          </h2>
        )}

        {showSettings && (
          <button
            type="button"
            onClick={onSettingsClick}
            aria-label="Product Settings"
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="size-3.5" />
          </button>
        )}
      </div>

      {/* Right section: Record pagination OR custom actions (e.g. Cancel & Save) */}
      <div className="flex items-center gap-2">
        {actions ? (
          actions
        ) : (
          recordIndex !== undefined &&
          totalRecords !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono font-medium px-1.5">
                {recordIndex}/{totalRecords}
              </span>
              <div className="flex items-center rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={onPrevRecord}
                  disabled={!onPrevRecord}
                  aria-label="Previous product"
                  className="p-1 hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-border" />
                <button
                  type="button"
                  onClick={onNextRecord}
                  disabled={!onNextRecord}
                  aria-label="Next product"
                  className="p-1 hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default PageToolbar;
