// client/src/services/productService.js
import { INITIAL_PRODUCTS } from "@/data/mockProducts";

const STORAGE_KEY = "rental_mgmt_products_v2";

function getStoredProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return [...INITIAL_PRODUCTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_PRODUCTS];
  } catch (e) {
    console.warn("Error reading stored products:", e);
    return [...INITIAL_PRODUCTS];
  }
}

function saveProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn("Error saving products to storage:", e);
  }
}

export function getAllProducts() {
  return getStoredProducts();
}

export function getFilteredProducts({
  category = "All Categories",
  search = "",
  sortBy = "name-asc",
  page = 1,
  limit = 8,
} = {}) {
  const all = getStoredProducts();

  let filtered = all.filter((product) => {
    const matchesCategory =
      !category || category === "All Categories" || product.category === category;
    const matchesSearch =
      !search ||
      product.name?.toLowerCase().includes(search.toLowerCase().trim()) ||
      product.category?.toLowerCase().includes(search.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  // Sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name-desc":
        return (b.name || "").localeCompare(a.name || "");
      case "price-asc":
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case "price-desc":
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case "name-asc":
      default:
        return (a.name || "").localeCompare(b.name || "");
    }
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page: currentPage,
    totalPages,
    limit,
  };
}

export function getProductById(productId) {
  const all = getStoredProducts();
  return all.find((p) => p.id === productId || String(p.id) === String(productId)) || null;
}

export function getProductNavigationInfo(productId) {
  const all = getStoredProducts();
  const currentIndex = all.findIndex((p) => p.id === productId || String(p.id) === String(productId));

  if (currentIndex === -1) {
    return {
      index: 1,
      total: all.length || 1,
      prevId: null,
      nextId: null,
    };
  }

  const prevIndex = currentIndex > 0 ? currentIndex - 1 : all.length - 1;
  const nextIndex = currentIndex < all.length - 1 ? currentIndex + 1 : 0;

  return {
    index: currentIndex + 1,
    total: all.length,
    prevId: all[prevIndex]?.id || null,
    nextId: all[nextIndex]?.id || null,
  };
}

export function createProduct(productData) {
  const all = getStoredProducts();
  const slug = productData.name
    ? productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    : `prod-${Date.now()}`;
  
  const id = `${slug}-${Date.now().toString().slice(-4)}`;

  const newProduct = {
    id,
    name: productData.name?.trim() || "Untitled Product",
    price: Number(productData.price) || 0,
    category: productData.category || "Uncategorized",
    color: productData.color || "Standard",
    image: productData.image || `/images/products/${slug}.jpg`,
    pricingRules: Array.isArray(productData.pricingRules) && productData.pricingRules.length > 0
      ? productData.pricingRules
      : [
          { id: "1", duration: "1 Hour", pricelist: "Standard", price: 0 },
          { id: "2", duration: "1 Day", pricelist: "Standard", price: 0 },
          { id: "3", duration: "3 Days", pricelist: "Standard", price: 0 },
        ],
    reservationCharges: {
      extraHour: Number(productData.reservationCharges?.extraHour) || 0,
      extraDay: Number(productData.reservationCharges?.extraDay) || 0,
      additionalCharge: Number(productData.reservationCharges?.additionalCharge) || 0,
    },
    stock: Number(productData.stock) || 10,
    createdAt: new Date().toISOString(),
  };

  all.unshift(newProduct);
  saveProducts(all);
  return newProduct;
}

export function updateProduct(productId, updates) {
  const all = getStoredProducts();
  const index = all.findIndex((p) => p.id === productId || String(p.id) === String(productId));
  if (index === -1) return null;

  const existing = all[index];
  const updatedProduct = {
    ...existing,
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updatedProduct;
  saveProducts(all);
  return updatedProduct;
}

export function deleteProduct(productId) {
  const all = getStoredProducts();
  const filtered = all.filter((p) => p.id !== productId && String(p.id) !== String(productId));
  saveProducts(filtered);
  return true;
}

export function duplicateProduct(productId) {
  const original = getProductById(productId);
  if (!original) return null;

  const duplicatedData = {
    ...original,
    name: `${original.name} (Copy)`,
    id: undefined, // createProduct will generate a unique id
  };

  return createProduct(duplicatedData);
}

export function resetMockProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return [...INITIAL_PRODUCTS];
}
