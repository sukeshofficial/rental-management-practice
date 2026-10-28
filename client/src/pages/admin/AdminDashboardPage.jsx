// client/src/pages/admin/AdminDashboardPage.jsx
import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Package,
  CalendarPlus,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import DataTable from "@/components/admin/DataTable";
import { DASHBOARD_METRICS, RECENT_RENTAL_ACTIVITY, QUICK_ACTIONS } from "@/data/mockDashboard";

const ACTION_ICONS = {
  Package,
  CalendarPlus,
  ClipboardList,
  BarChart3,
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Oct 26, 2024 - Nov 01, 2024");
  const [notification, setNotification] = useState("");

  const dateRangeOptions = [
    "Today",
    "Yesterday",
    "Oct 26, 2024 - Nov 01, 2024",
    "Last 30 Days",
    "This Quarter",
  ];

  // Table columns definition
  const columns = [
    {
      key: "id",
      header: "#",
      headerClassName: "w-12 text-center",
      cellClassName: "w-12 text-center font-mono text-xs text-muted-foreground",
    },
    {
      key: "customer",
      header: "Customer",
      headerClassName: "min-w-[140px]",
      render: (row) => (
        <span className="font-medium text-foreground">{row.customer}</span>
      ),
    },
    {
      key: "product",
      header: "Product",
      headerClassName: "min-w-[160px]",
      render: (row) => (
        <span className="text-muted-foreground">{row.product}</span>
      ),
    },
    {
      key: "rentalPeriod",
      header: "Rental Period",
      headerClassName: "min-w-[180px]",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.rentalPeriod}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
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
      {/* Sticky Top Navbar */}
      <AdminNavbar activeTab="dashboard" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Welcome back, Adam"
          description="Here's what's happening with your rental business today."
          actions={
            <div className="relative">
              <button
                type="button"
                onClick={() => setDateRangeOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-expanded={dateRangeOpen}
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{selectedRange}</span>
                <ChevronDown className="size-3 text-muted-foreground opacity-70" />
              </button>

              {dateRangeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDateRangeOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg z-40 animate-in fade-in-50 zoom-in-95">
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Select Range
                    </div>
                    {dateRangeOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedRange(opt);
                          setDateRangeOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          selectedRange === opt
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          }
        />

        {/* Demo banner note */}
        {notification && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between animate-in fade-in">
            <span>{notification}</span>
            <button
              onClick={() => setNotification("")}
              className="text-xs font-semibold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <section aria-label="Key Performance Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DASHBOARD_METRICS.map((metric) => (
              <StatCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend}
                subtext={metric.subtext}
                accentColor={metric.accentColor}
              />
            ))}
          </div>
        </section>

        {/* 2-Column Section: Recent Rental Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recent Rental Activity (col-span-8) */}
          <section className="lg:col-span-8 space-y-3" aria-labelledby="recent-activity-title">
            <div className="flex items-center justify-between">
              <h2
                id="recent-activity-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Recent Rental Activity
              </h2>
              <Link
                to="/rental"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <DataTable columns={columns} data={RECENT_RENTAL_ACTIVITY} />
          </section>

          {/* Right Column: Quick Actions (col-span-4) */}
          <section className="lg:col-span-4 space-y-3" aria-labelledby="quick-actions-title">
            <h2
              id="quick-actions-title"
              className="text-base font-semibold text-foreground tracking-tight"
            >
              Quick Actions
            </h2>

            <div className="space-y-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = ACTION_ICONS[action.icon] || Package;
                return (
                  <Link
                    key={action.id}
                    to={action.to}
                    onClick={(e) => {
                      if (action.id === "view-reports") {
                        e.preventDefault();
                        setNotification("Demonstration Report: Total revenue this month is ₹48,250 across 86 orders.");
                      }
                    }}
                    className="group flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
