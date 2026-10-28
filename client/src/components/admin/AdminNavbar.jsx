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
  Search,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ModeToggle from "@/components/theme/mode-toggle";
import { useTheme } from "@/components/theme/theme-provider";
import { useAuth } from "@/context/AuthContext";

/**
 * Reusable Admin Navigation Bar
 * Stays sticky at the top with a subtle backdrop blur.
 * Highlights the current active destination cleanly.
 */
export function AdminNavbar({ activeTab: explicitActiveTab, className }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const userName = user?.name || "Adam";

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
            {/* Home button (black squircle icon) */}
            <Link
              to="/dashboard"
              aria-label="Admin Home"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 font-semibold shadow-xs"
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
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                  P
                </div>
                <span className="font-medium max-w-[100px] truncate">
                  prithivi.code...
                </span>
                <ChevronDown className="size-3 text-muted-foreground opacity-70" />
              </button>

              {/* Profile dropdown menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-card p-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-2.5 py-2 border-b border-border/60">
                      <p className="text-xs font-semibold text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user?.email || "adam@rental.com"}
                      </p>
                    </div>
                    <div className="pt-1">
                      <Link
                        to="/product"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Package className="size-3.5" />
                        <span>Manage Products</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
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
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
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
