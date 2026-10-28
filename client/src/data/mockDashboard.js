// client/src/data/mockDashboard.js
/**
 * Mock data for Screen 01: Admin Dashboard.
 * Includes metrics, recent rental activity, and quick actions.
 */

export const DASHBOARD_METRICS = [
  {
    id: "total-products",
    title: "Total Products",
    value: "128",
    change: "+ 12%",
    trend: "up",
    subtext: "Active rental items",
    accentColor: "purple", // purple squircle
  },
  {
    id: "active-rentals",
    title: "Active Rentals",
    value: "24",
    change: "+ 8%",
    trend: "up",
    subtext: "Currently rented out",
    accentColor: "blue", // blue squircle
  },
  {
    id: "total-orders",
    title: "Total Orders",
    value: "86",
    change: "+ 18%",
    trend: "up",
    subtext: "This month",
    accentColor: "emerald", // emerald squircle
  },
  {
    id: "revenue",
    title: "Revenue",
    value: "₹ 48,250",
    change: "+ 14%",
    trend: "up",
    subtext: "This month",
    accentColor: "amber", // amber squircle
  },
];

export const RECENT_RENTAL_ACTIVITY = [
  {
    id: 1,
    customer: "Rahul Sharma",
    product: "Canon EOS R6",
    rentalPeriod: "Oct 26 - Oct 28, 2024",
    status: "Active",
  },
  {
    id: 2,
    customer: "Priya Mehta",
    product: "Projector EB-FH06",
    rentalPeriod: "Oct 25 - Oct 27, 2024",
    status: "Active",
  },
  {
    id: 3,
    customer: "Amit Verma",
    product: "Folding Table",
    rentalPeriod: "Oct 24 - Oct 26, 2024",
    status: "Completed",
  },
  {
    id: 4,
    customer: "Sneha Kapoor",
    product: "Drill Machine",
    rentalPeriod: "Oct 22 - Oct 25, 2024",
    status: "Completed",
  },
  {
    id: 5,
    customer: "Karan Patel",
    product: "Camping Tent",
    rentalPeriod: "Oct 21 - Oct 23, 2024",
    status: "Completed",
  },
];

export const QUICK_ACTIONS = [
  {
    id: "manage-products",
    title: "Manage Products",
    description: "Add, edit or update products",
    to: "/product",
    icon: "Package",
    color: "blue",
  },
  {
    id: "create-rental-order",
    title: "Create Rental Order",
    description: "New rental booking",
    to: "/rental",
    icon: "CalendarPlus",
    color: "blue",
  },
  {
    id: "view-all-orders",
    title: "View All Orders",
    description: "Track and manage orders",
    to: "/order",
    icon: "ClipboardList",
    color: "purple",
  },
  {
    id: "view-reports",
    title: "View Reports",
    description: "Sales, rentals and analytics",
    to: "/reporting",
    icon: "BarChart3",
    color: "violet",
  },
];
