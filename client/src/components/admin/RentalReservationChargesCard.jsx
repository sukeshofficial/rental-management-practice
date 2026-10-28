// client/src/components/admin/RentalReservationChargesCard.jsx
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Rental Reservation Charges Card
 * Supports mode="edit" and mode="display" with 3-column layout:
 * [Label] | [Input or Amount in ₹] | [Explanatory text]
 */
export function RentalReservationChargesCard({
  mode = "display", // "display" | "edit"
  charges = {},
  onChange,
  className,
}) {
  const isEdit = mode === "edit";

  const handleChargeChange = (field, val) => {
    if (!onChange) return;
    if (val === "") {
      onChange({ ...charges, [field]: "" });
      return;
    }
    const num = parseFloat(val);
    onChange({ ...charges, [field]: isNaN(num) ? "" : num });
  };

  const formatINR = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-IN");
  };

  const chargeItems = [
    {
      field: "extraHour",
      label: "Extra Hour",
      defaultVal: 100,
      description: "Additional charge per hour beyond selected duration.",
    },
    {
      field: "extraDay",
      label: "Extra Day",
      defaultVal: 300,
      description: "Additional charge per day beyond selected duration.",
    },
    {
      field: "additionalCharge",
      label: "Additional Charge",
      defaultVal: 200,
      description: "Any other additional charge (e.g. cleaning, damages, etc.)",
    },
  ];

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
          Rental Reservation Charges
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isEdit
            ? "Configure additional charges for extended usage or special cases."
            : "Additional charges for extended usage or special cases."}
        </p>
      </div>

      {/* Charge Rows */}
      <div className="space-y-3.5 pt-1">
        {chargeItems.map((item) => {
          const val = charges[item.field] !== undefined ? charges[item.field] : item.defaultVal;

          return (
            <div
              key={item.field}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center py-1"
            >
              {/* Col 1: Label */}
              <span className="sm:col-span-3 text-xs font-semibold text-foreground">
                {item.label}
              </span>

              {/* Col 2: Input or Display Amount */}
              <div className="sm:col-span-4">
                {isEdit ? (
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-2.5 text-xs text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={val === 0 && val !== "" ? 0 : val ?? ""}
                      onChange={(e) => handleChargeChange(item.field, e.target.value)}
                      className="h-8 w-full rounded-lg border border-border/90 bg-background dark:bg-input/30 pl-6 pr-2.5 text-xs font-semibold text-foreground outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    ₹ {formatINR(val)}
                  </span>
                )}
              </div>

              {/* Col 3: Description with divider in display mode */}
              <div className="sm:col-span-5 flex items-center">
                {!isEdit && (
                  <span className="hidden sm:inline-block h-6 w-px bg-border/80 mr-3 shrink-0" />
                )}
                <span className="text-[11px] text-muted-foreground leading-snug">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RentalReservationChargesCard;
