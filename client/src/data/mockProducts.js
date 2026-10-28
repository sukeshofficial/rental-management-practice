// client/src/data/mockProducts.js
/**
 * Mock data for rental product catalog and inventory.
 * Field structure aligns with the reference designs and requirements:
 * - Basic general info: name, basePrice, category, color, image template
 * - Rental pricing rules: duration, pricelist, price
 * - Rental reservation charges: extraHour, extraDay, additionalCharge
 */

export const INITIAL_PRODUCTS = [
  {
    id: "canon-eos-r6",
    name: "Canon EOS R6",
    price: 2500,
    category: "Cameras & Accessories",
    color: "Black",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "High-performance full-frame mirrorless camera with 20.1MP sensor, 4K video recording and advanced autofocus. Ideal for professional photography and videography.",
    pricingRules: [
      { id: "p1", duration: "1 Hour", pricelist: "Standard", price: 300 },
      { id: "p2", duration: "1 Day", pricelist: "Standard", price: 800 },
      { id: "p3", duration: "3 Days", pricelist: "Standard", price: 2000 },
      { id: "p4", duration: "7 Days", pricelist: "Premium", price: 3500 },
    ],
    reservationCharges: {
      extraHour: 100,
      extraDay: 300,
      additionalCharge: 200,
    },
    stock: 12,
  },
  {
    id: "bosch-drill-machine",
    name: "Bosch Drill Machine",
    price: 800,
    category: "Power Tools",
    color: "Teal / Green",
    image: "/images/products/bosch-drill-machine.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Hour", pricelist: "Standard", price: 150 },
      { id: "p2", duration: "1 Day", pricelist: "Standard", price: 500 },
      { id: "p3", duration: "3 Days", pricelist: "Standard", price: 1200 },
    ],
    reservationCharges: {
      extraHour: 50,
      extraDay: 150,
      additionalCharge: 100,
    },
    stock: 8,
  },
  {
    id: "epson-projector-eb-fh06",
    name: "Epson Projector EB-FH06",
    price: 3000,
    category: "AV Equipment",
    color: "White",
    image: "/images/products/epson-projector.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Hour", pricelist: "Standard", price: 400 },
      { id: "p2", duration: "1 Day", pricelist: "Standard", price: 1200 },
      { id: "p3", duration: "3 Days", pricelist: "Standard", price: 2800 },
    ],
    reservationCharges: {
      extraHour: 150,
      extraDay: 400,
      additionalCharge: 250,
    },
    stock: 5,
  },
  {
    id: "folding-chair",
    name: "Folding Chair",
    price: 150,
    category: "Furniture & Event",
    color: "Black",
    image: "/images/products/folding-chair.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Day", pricelist: "Standard", price: 150 },
      { id: "p2", duration: "3 Days", pricelist: "Standard", price: 350 },
      { id: "p3", duration: "1 Week", pricelist: "Standard", price: 700 },
    ],
    reservationCharges: {
      extraHour: 20,
      extraDay: 50,
      additionalCharge: 50,
    },
    stock: 45,
  },
  {
    id: "folding-table",
    name: "Folding Table",
    price: 300,
    category: "Furniture & Event",
    color: "Gray",
    image: "/images/products/folding-table.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Day", pricelist: "Standard", price: 300 },
      { id: "p2", duration: "3 Days", pricelist: "Standard", price: 750 },
      { id: "p3", duration: "1 Week", pricelist: "Standard", price: 1400 },
    ],
    reservationCharges: {
      extraHour: 30,
      extraDay: 100,
      additionalCharge: 100,
    },
    stock: 20,
  },
  {
    id: "pressure-washer",
    name: "Pressure Washer",
    price: 1200,
    category: "Cleaning & Outdoor",
    color: "Yellow",
    image: "/images/products/pressure-washer.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Hour", pricelist: "Standard", price: 250 },
      { id: "p2", duration: "1 Day", pricelist: "Standard", price: 800 },
      { id: "p3", duration: "3 Days", pricelist: "Standard", price: 1800 },
    ],
    reservationCharges: {
      extraHour: 80,
      extraDay: 250,
      additionalCharge: 150,
    },
    stock: 6,
  },
  {
    id: "camping-tent",
    name: "Camping Tent",
    price: 1500,
    category: "Camping & Adventure",
    color: "Green",
    image: "/images/products/camping-tent.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Day", pricelist: "Standard", price: 700 },
      { id: "p2", duration: "3 Days", pricelist: "Standard", price: 1500 },
      { id: "p3", duration: "1 Week", pricelist: "Standard", price: 3000 },
    ],
    reservationCharges: {
      extraHour: 100,
      extraDay: 300,
      additionalCharge: 200,
    },
    stock: 14,
  },
  {
    id: "jbl-partybox-speaker",
    name: "JBL PartyBox Speaker",
    price: 2000,
    category: "Audio & DJ",
    color: "Black",
    image: "/images/products/jbl-partybox.jpg",
    pricingRules: [
      { id: "p1", duration: "1 Hour", pricelist: "Standard", price: 300 },
      { id: "p2", duration: "1 Day", pricelist: "Standard", price: 1200 },
      { id: "p3", duration: "3 Days", pricelist: "Standard", price: 2500 },
    ],
    reservationCharges: {
      extraHour: 120,
      extraDay: 350,
      additionalCharge: 250,
    },
    stock: 9,
  },
];

export const CATEGORIES = [
  "All Categories",
  "Cameras & Accessories",
  "Camera & Accessories",
  "Power Tools",
  "AV Equipment",
  "Furniture & Event",
  "Cleaning & Outdoor",
  "Camping & Adventure",
  "Audio & DJ",
];

export const DURATION_OPTIONS = [
  "1 Hour",
  "2 Hours",
  "4 Hours",
  "1 Day",
  "2 Days",
  "3 Days",
  "1 Week",
  "1 Month",
];

export const PRICELIST_OPTIONS = [
  "Standard",
  "Premium",
  "Corporate",
  "Weekend Special",
  "Seasonal Discount",
];

export const COLOR_OPTIONS = [
  "Black",
  "Silver",
  "White",
  "Gray",
  "Teal / Green",
  "Yellow",
  "Red",
  "Blue",
  "Orange",
];
