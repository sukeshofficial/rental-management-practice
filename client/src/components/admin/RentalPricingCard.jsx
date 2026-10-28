// client/src/components/admin/RentalPricingCard.jsx
import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Select from "@/components/ui/select";
import { DURATION_OPTIONS, PRICELIST_OPTIONS } from "@/data/mockProducts";

/**
 * Reusable Rental Pricing Card
 * Supports mode="edit" (interactive table with dropdowns, inputs, + Add Pricing Rule)
 * and mode="display" (clean read-only table matching reference)
 */
export function RentalPricingCard({
  mode = "display", // "display" | "edit"
  pricingRules = [],
  onChange,
  onAddRule,
  onRemoveRule,
  className,
}) {
  const isEdit = mode === "edit";

  const handleRowChange = (id, field, value) => {
    if (!onChange) return;
    const updated = pricingRules.map((rule) => {
      if (rule.id === id) {
        return {
          ...rule,
          [field]: field === "price" ? (value === "" ? "" : parseFloat(value) || 0) : value,
        };
      }
      return rule;
    });
    onChange(updated);
  };

  const formatINR = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-IN");
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4",
        className
      )}
    >
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          Rental Pricing
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isEdit
            ? "Set custom rental rates for different durations and price lists."
            : "Rental rates for different durations and price lists."}
        </p>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-2 w-8 text-center">#</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Price List</th>
              <th className="py-2.5 px-3">Price (₹)</th>
              {isEdit && <th className="py-2.5 px-2 w-10 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {Array.isArray(pricingRules) && pricingRules.length > 0 ? (
              pricingRules.map((rule, idx) => (
                <tr key={rule.id || idx} className="hover:bg-muted/20 transition-colors">
                  {/* Row number */}
                  <td className="py-2.5 px-2 text-center font-medium text-muted-foreground">
                    {idx + 1}
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-3">
                    {isEdit ? (
                      <div className="w-28 sm:w-32">
                        <Select
                          value={rule.duration || "1 Day"}
                          onChange={(e) =>
                            handleRowChange(rule.id, "duration", e.target.value)
                          }
                          options={DURATION_OPTIONS}
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-foreground">
                        {rule.duration}
                      </span>
                    )}
                  </td>

                  {/* Price List */}
                  <td className="py-2 px-3">
                    {isEdit ? (
                      <div className="w-28 sm:w-32">
                        <Select
                          value={rule.pricelist || "Standard"}
                          onChange={(e) =>
                            handleRowChange(rule.id, "pricelist", e.target.value)
                          }
                          options={PRICELIST_OPTIONS}
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {rule.pricelist || "Standard"}
                      </span>
                    )}
                  </td>

                  {/* Price (₹) */}
                  <td className="py-2 px-3">
                    {isEdit ? (
                      <div className="relative flex items-center w-24 sm:w-28">
                        <span className="pointer-events-none absolute left-2 text-xs text-muted-foreground">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={rule.price === 0 && rule.price !== "" ? 0 : rule.price ?? ""}
                          onChange={(e) =>
                            handleRowChange(rule.id, "price", e.target.value)
                          }
                          className="h-8 w-full rounded-lg border border-border/90 bg-background dark:bg-input/30 pl-6 pr-2 text-xs font-semibold text-foreground outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-foreground">
                        ₹ {formatINR(rule.price)}
                      </span>
                    )}
                  </td>

                  {/* Actions (Delete row button) */}
                  {isEdit && (
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveRule?.(rule.id)}
                        disabled={pricingRules.length <= 1}
                        aria-label="Remove pricing row"
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isEdit ? 5 : 4}
                  className="py-4 text-center text-xs text-muted-foreground"
                >
                  No pricing rules configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Pricing Rule button in edit mode */}
      {isEdit && (
        <button
          type="button"
          onClick={onAddRule}
          className="w-full rounded-xl border border-dashed border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 py-2.5 px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="size-3.5" />
          <span>Add Pricing Rule</span>
        </button>
      )}
    </div>
  );
}

export default RentalPricingCard;
