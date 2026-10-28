// client/src/pages/admin/ProductsOverviewPage.jsx
import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import ProductCard from "@/components/admin/ProductCard";
import Select from "@/components/ui/select";
import {
  fetchProducts,
  fetchCategories,
  setSearchQuery,
  setSelectedCategory,
  setSorting,
  setPage,
  setLimit,
  setViewMode,
  resetFilters,
  archiveProduct,
  selectProducts,
  selectCategories,
  selectPagination,
  selectFilters,
  selectViewMode,
  selectIsLoading,
  selectProductsError,
} from "@/redux/Slices/productsSlice";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function ProductsOverviewPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const viewMode = useSelector(selectViewMode);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectProductsError);

  const [searchInput, setSearchInput] = useState(filters.q || "");
  const [isPending, startTransition] = useTransition();

  // Load categories and initial products on mount
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts());
  }, [dispatch]);

  // Sync search input when filters change externally
  useEffect(() => {
    setSearchInput(filters.q || "");
  }, [filters.q]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.q) {
        startTransition(() => {
          dispatch(setSearchQuery(searchInput));
          dispatch(fetchProducts({ q: searchInput, page: 1 }));
        });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, filters.q, dispatch]);

  // Category change handler
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    dispatch(setSelectedCategory(newCat));
    dispatch(fetchProducts({ category: newCat, page: 1 }));
  };

  // Sort change handler
  const handleSortChange = (e) => {
    const val = e.target.value;
    let sortBy = "name";
    let sortOrder = "asc";

    if (val === "name-asc") {
      sortBy = "name";
      sortOrder = "asc";
    } else if (val === "name-desc") {
      sortBy = "name";
      sortOrder = "desc";
    } else if (val === "price-asc") {
      sortBy = "price";
      sortOrder = "asc";
    } else if (val === "price-desc") {
      sortBy = "price";
      sortOrder = "desc";
    }

    dispatch(setSorting({ sortBy, sortOrder }));
    dispatch(fetchProducts({ sortBy, sortOrder, page: 1 }));
  };

  // Page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    dispatch(setPage(newPage));
    dispatch(fetchProducts({ page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    dispatch(setLimit(newLimit));
    dispatch(fetchProducts({ limit: newLimit, page: 1 }));
  };

  // Handlers for card actions
  const handleEdit = (prod) => {
    navigate(`/product/create?edit=${prod.id}`);
  };

  const handleDuplicate = (prod) => {
    navigate("/product/create", {
      state: {
        product: {
          ...prod,
          name: `${prod.name} (Copy)`,
          sku: `${prod.sku}-COPY`,
        },
      },
    });
  };

  const handleArchive = async (prod) => {
    if (window.confirm(`Are you sure you want to archive "${prod.name}"?`)) {
      await dispatch(archiveProduct(prod.id));
    }
  };

  // Build category options list for dropdown
  const categoryOptions = React.useMemo(() => {
    const list = ["All Categories"];
    if (Array.isArray(categories)) {
      categories.forEach((c) => {
        const val = typeof c === "string" ? c : c.value || c.label;
        if (val && !list.includes(val)) list.push(val);
      });
    }
    return list;
  }, [categories]);

  // Current sort value
  const currentSortVal = `${filters.sortBy}-${filters.sortOrder}`;

  const sortOptions = [
    { label: "Sort by Name (A-Z)", value: "name-asc" },
    { label: "Sort by Name (Z-A)", value: "name-desc" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
  ];

  // RBAC permission check for creating product
  const canCreateProduct =
    user?.isAdmin ||
    user?.role === "internal_staff" ||
    (Array.isArray(user?.permissions) &&
      (user.permissions.includes("inventory.manage") || user.permissions.includes("*")));

  // Calculate displayed range
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AdminNavbar activeTab="products" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Header (Matching Reference 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Products
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage your rental products and inventory.
            </p>
          </div>

          {canCreateProduct && (
            <button
              type="button"
              onClick={() => navigate("/product/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shrink-0 self-start sm:self-center"
            >
              <Plus className="size-4" />
              <span>Create Product</span>
            </button>
          )}
        </div>

        {/* Toolbar: Search, Category, Sort, View Toggle */}
        <section
          aria-label="Product Search and Filter Controls"
          className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        >
          {/* Left Controls: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, categories, keywords..."
              maxLength={200}
              aria-label="Search rental products"
              className="h-9 w-full rounded-xl border border-input bg-card pl-9 pr-8 text-xs sm:text-sm outline-none transition-colors focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Category + Sort + View Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Category Filter */}
            <div className="w-40 sm:w-48 shrink-0">
              <Select
                value={filters.category || "All Categories"}
                onChange={handleCategoryChange}
                options={categoryOptions}
                aria-label="Filter by Category"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-44 sm:w-48 shrink-0">
              <Select
                value={currentSortVal}
                onChange={handleSortChange}
                options={sortOptions}
                aria-label="Sort products"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-border/80 bg-card p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => dispatch(setViewMode("grid"))}
                aria-label="Grid view"
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => dispatch(setViewMode("list"))}
                aria-label="List view"
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Count and Range Info Bar (Matching Reference 3) */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>{pagination.total} products</span>
          {pagination.total > 0 && (
            <span>
              Showing {startItem}-{endItem} of {pagination.total}
            </span>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(fetchProducts())}
              className="font-medium underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner / Products Container */}
        {isLoading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-xs text-muted-foreground">Loading rental inventory...</p>
          </div>
        ) : products.length > 0 ? (
          viewMode === "grid" ? (
            /* 4-column Grid layout on desktop (Reference Image 3) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id || prod.sku}
                  product={prod}
                  onEdit={canCreateProduct ? handleEdit : undefined}
                  onDuplicate={canCreateProduct ? handleDuplicate : undefined}
                  onArchive={user?.isAdmin ? handleArchive : undefined}
                />
              ))}
            </div>
          ) : (
            /* List View layout */
            <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-2 shadow-2xs divide-y divide-border/60">
              {products.map((prod) => (
                <div
                  key={prod.id || prod.sku}
                  onClick={() => navigate(`/product/${prod.id}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-14 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <PackageOpen className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{prod.category}</p>
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {prod.name}
                      </h3>
                      <div className="pt-0.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-medium",
                            prod.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              prod.status === "active" ? "bg-emerald-500" : "bg-blue-500"
                            )}
                          />
                          {prod.status === "active" ? "Active" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base sm:text-lg text-foreground">
                      ₹ {prod.basePrice?.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[11px] text-muted-foreground">Base price</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-card/50 p-8 space-y-3">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <PackageOpen className="size-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No products found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {filters.q || (filters.category && filters.category !== "All Categories")
                  ? "Try adjusting your search criteria or category filter."
                  : "No rental products have been registered in this catalog yet."}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              {(filters.q || (filters.category && filters.category !== "All Categories")) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    dispatch(resetFilters());
                    dispatch(fetchProducts({ q: "", category: "All Categories", page: 1 }));
                  }}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  Reset filters
                </button>
              )}
              {canCreateProduct && (
                <button
                  type="button"
                  onClick={() => navigate("/product/create")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs cursor-pointer"
                >
                  Create new product
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Bar: Rows per page + Pagination (Matching Reference 3) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 border-t border-border/60">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <nav
              aria-label="Pagination Navigation"
              className="flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous Page"
                className="flex size-8 items-center justify-center rounded-lg border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = pagination.page === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-2xs"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="Next Page"
                className="flex size-8 items-center justify-center rounded-lg border border-border/80 text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}
