// client/src/pages/admin/ProductsOverviewPage.jsx
import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  X,
} from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import PageHeader from "@/components/admin/PageHeader";
import ProductCard from "@/components/admin/ProductCard";
import Select from "@/components/ui/select";
import { getFilteredProducts } from "@/services/productService";
import { CATEGORIES } from "@/data/mockProducts";
import { cn } from "@/lib/utils";

export default function ProductsOverviewPage() {
  const navigate = useNavigate();

  // Filter & Search states
  const [category, setCategory] = useState("All Categories");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [isLoading, setIsLoading] = useState(false);

  // Fetch filtered data
  const productData = useMemo(() => {
    return getFilteredProducts({
      category,
      search,
      sortBy,
      page,
      limit: 8,
    });
  }, [category, search, sortBy, page]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [category, search, sortBy]);

  const sortOptions = [
    { label: "Sort by Name (A-Z)", value: "name-asc" },
    { label: "Sort by Name (Z-A)", value: "name-desc" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Shared Navbar */}
      <AdminNavbar activeTab="products" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Products"
          description="Manage your rental products and inventory."
          actions={
            <button
              type="button"
              onClick={() => navigate("/product/create")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Plus className="size-4" />
              <span>Create Product</span>
            </button>
          }
        />

        {/* Product Discovery Controls Toolbar */}
        <section
          aria-label="Product Search and Filter Controls"
          className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1"
        >
          {/* Left Controls: Category filter + Search input */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            {/* Category Dropdown */}
            <div className="w-36 sm:w-44 shrink-0">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                aria-label="Filter by Category"
              />
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                aria-label="Search rental products"
                className="h-8 w-full rounded-lg border border-input bg-background dark:bg-input/30 pl-8 pr-7 text-xs sm:text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Sort dropdown + View Mode */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="w-44">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
                aria-label="Sort products"
              />
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Product Cards Display */}
        {productData.items.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {productData.items.map((prod) => (
                <ProductCard
                  key={prod.id}
                  id={prod.id}
                  name={prod.name}
                  price={prod.price}
                  image={prod.image}
                  category={prod.category}
                />
              ))}
            </div>
          ) : (
            /* List View layout */
            <div className="space-y-2 rounded-xl border border-border/80 bg-card p-2 shadow-xs divide-y divide-border/60">
              {productData.items.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/product/${prod.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="size-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <PackageOpen className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{prod.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">
                      ₹ {prod.price.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[11px] text-muted-foreground">Base price</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-muted/10 p-8 space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <PackageOpen className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No products found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {search || category !== "All Categories"
                  ? "Try adjusting your search criteria or category filter to find rental items."
                  : "No rental products have been registered in this catalog yet."}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              {(search || category !== "All Categories") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All Categories");
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Reset filters
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/product/create")}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs"
              >
                Create new product
              </button>
            </div>
          </div>
        )}

        {/* Pagination Section (matching `< 1 2 3 4 ... 10 >` in reference) */}
        {productData.totalPages > 1 && (
          <nav
            aria-label="Pagination Navigation"
            className="flex items-center justify-center gap-1 pt-4 pb-2"
          >
            {/* Previous page button */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous Page"
              className="flex size-7 items-center justify-center rounded-lg border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: productData.totalPages }, (_, i) => i + 1).map(
              (pageNum) => {
                const isActive = page === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}

            {/* Next page button */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(productData.totalPages, p + 1))}
              disabled={page === productData.totalPages}
              aria-label="Next Page"
              className="flex size-7 items-center justify-center rounded-lg border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
