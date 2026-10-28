// client/src/components/admin/AdminNavbar.jsx
import * as React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ModeToggle from "@/components/theme/mode-toggle";
import { useAuth } from "@/context/AuthContext";

/**
 * Reusable Admin Navigation Bar
 * Matches Reference Image 3 and Reference Image 1:
 * - Active tab: blue border / pill style (e.g. Products)
 * - User pill: Initial avatar, dynamically derived user display name or email, dropdown chevron
 * - Real authenticated user session data
 */
export function AdminNavbar({ activeTab: explicitActiveTab, className }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser, loading: isAuthLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Determine active tab automatically or from prop
  const getActiveTab = () => {
    if (explicitActiveTab) return explicitActiveTab;
    const path = location.pathname;
    if (path.startsWith("/product")) return "products";
    if (path.startsWith("/rental")) return "rental";
    if (path.startsWith("/order")) return "order";
    if (path.startsWith("/reporting")) return "reporting";
    if (path.startsWith("/settings")) return "setting";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { id: "rental", label: "Rental", to: "/rental", icon: CalendarCheck },
    { id: "order", label: "Order", to: "/rental?tab=orders", icon: ShoppingBag },
    { id: "products", label: "Products", to: "/product", icon: Package },
    { id: "reporting", label: "Reporting", to: "/dashboard?tab=reporting", icon: BarChart3 },
    { id: "setting", label: "Setting", to: "/dashboard?tab=settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  // Derive dynamic user details safely
  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "User");
  const displayEmail = user?.email || "";
  const displayInitial = (displayName || "U").charAt(0).toUpperCase();

  // RBAC checks
  const isAdmin = user?.isAdmin === true || user?.role === "admin";
  const canManageProducts =
    isAdmin ||
    user?.role === "internal_staff" ||
    (Array.isArray(user?.permissions) &&
      (user.permissions.includes("inventory.manage") || user.permissions.includes("*")));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2">
          {/* Left section: Home icon + Navigation tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Home button (black squircle icon matching Reference 1 & 3) */}
            <Link
              to="/dashboard"
              aria-label="Admin Home"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Home className="size-4" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-all select-none",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/70 font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right section: Theme toggle button + User profile dropdown + Mobile menu trigger */}
          <div className="flex items-center gap-2">
            <ModeToggle size="sm" className="hidden sm:inline-flex" />

            {/* User Profile dropdown */}
            <div className="relative">
              {isAuthLoading ? (
                <div className="h-8 w-28 animate-pulse rounded-lg bg-muted/60" />
              ) : (
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                    {displayInitial}
                  </div>
                  <span className="font-medium max-w-[130px] truncate text-foreground">
                    {displayName}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground opacity-70" />
                </button>
              )}

              {/* Profile dropdown menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            <ShieldCheck className="size-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      {displayEmail && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {displayEmail}
                        </p>
                      )}
                      {user?.role && !isAdmin && (
                        <p className="text-[10px] text-muted-foreground/80 capitalize mt-0.5">
                          Role: {user.role.replace("_", " ")}
                        </p>
                      )}
                    </div>
                    <div className="pt-1">
                      {canManageProducts && (
                        <Link
                          to="/product"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Package className="size-3.5" />
                          <span>Manage Products</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="size-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex size-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/80 py-2 pb-3 space-y-1 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 px-3 flex items-center justify-between border-t border-border/60">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ModeToggle size="sm" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default AdminNavbar;
