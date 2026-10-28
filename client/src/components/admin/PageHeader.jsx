// client/src/components/admin/PageHeader.jsx
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Page Header component.
 * Standardizes the page title, subtitle/description, and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1",
        className
      )}
    >
      <div className="space-y-1">
        <h1
          className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
            titleClassName
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-xs sm:text-sm text-muted-foreground",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
