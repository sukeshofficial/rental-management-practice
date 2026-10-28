// client/src/components/admin/DataTable.jsx
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Data Table for Admin Activity & Listings
 */
export function DataTable({
  columns = [],
  data = [],
  className,
  emptyMessage = "No records found.",
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={cn(
                    "px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={cn(
                        "px-4 py-3 text-foreground whitespace-nowrap",
                        col.cellClassName
                      )}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
