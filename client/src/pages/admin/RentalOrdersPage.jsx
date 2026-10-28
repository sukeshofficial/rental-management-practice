// client/src/pages/admin/RentalOrdersPage.jsx
import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Plus, Search, Filter, Clock, CheckCircle2 } from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import PageHeader from "@/components/admin/PageHeader";
import DataTable from "@/components/admin/DataTable";
import Select from "@/components/ui/select";
import { RECENT_RENTAL_ACTIVITY } from "@/data/mockDashboard";

export default function RentalOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const statusOptions = ["All", "Active", "Completed", "Pending"];

  const filteredData = RECENT_RENTAL_ACTIVITY.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !search ||
      item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.product.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: "id",
      header: "#",
      headerClassName: "w-12 text-center",
      cellClassName: "w-12 text-center font-mono text-xs text-muted-foreground",
    },
    {
      key: "customer",
      header: "Customer Name",
      headerClassName: "min-w-[150px]",
      render: (row) => (
        <span className="font-medium text-foreground">{row.customer}</span>
      ),
    },
    {
      key: "product",
      header: "Rented Product",
      headerClassName: "min-w-[170px]",
      render: (row) => (
        <span className="text-muted-foreground">{row.product}</span>
      ),
    },
    {
      key: "rentalPeriod",
      header: "Rental Duration",
      headerClassName: "min-w-[180px]",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.rentalPeriod}
        </span>
      ),
    },
    {
      key: "status",
      header: "Rental Status",
      headerClassName: "w-28 text-center",
      cellClassName: "w-28 text-center",
      render: (row) => {
        const isActive = row.status === "Active";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60"
                : "bg-muted/70 text-muted-foreground border-border/80"
            }`}
          >
            {isActive ? (
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            )}
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AdminNavbar activeTab="rental" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <PageHeader
          title="Rental Management"
          description="Track active rental bookings, schedules, and customer returns."
          actions={
            <Link
              to="/product"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="size-4" />
              <span>Browse Products for Booking</span>
            </Link>
          }
        />

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 flex-1 max-w-md">
            <div className="w-36 shrink-0">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                aria-label="Filter by Status"
              />
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rentals..."
                className="h-8 w-full rounded-lg border border-input bg-background dark:bg-input/30 pl-8 pr-3 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredData} />
      </main>
    </div>
  );
}
