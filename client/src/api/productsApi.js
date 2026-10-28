// client/src/api/productsApi.js
import api from "./api";

const PRODUCTS_BASE_URL = "/api/v1/products";

/**
 * Normalizes an image object or URL string to standard { url, alt, sortOrder }
 */
export function normalizeImage(img, index = 0) {
  if (!img) return null;
  if (typeof img === "string") {
    return { url: img.trim(), alt: "", sortOrder: index };
  }
  if (typeof img === "object" && img.url) {
    return {
      url: String(img.url).trim(),
      alt: img.alt ? String(img.alt).trim() : "",
      sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : index,
    };
  }
  return null;
}

/**
 * Normalizes full product document from API response
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  const id = raw.id || raw._id?.toString() || raw.slug;
  const name = raw.name || "Untitled Product";
  const slug = raw.slug || "";
  const sku = raw.sku || "";
  const description = raw.description || "";
  const category = raw.category || "Uncategorized";
  const color = raw.color || "";
  const currency = raw.currency || "INR";
  const basePrice = typeof raw.basePrice === "number" ? raw.basePrice : Number(raw.price) || 0;
  const status = raw.status || "active";
  const isRentable = raw.isRentable !== false;

  // Image normalization
  let rawImages = Array.isArray(raw.images) ? raw.images : [];
  if (rawImages.length === 0 && raw.image) {
    rawImages = [raw.image];
  }
  const images = rawImages.map(normalizeImage).filter(Boolean);
  const primaryImage = images.length > 0 ? images[0].url : (raw.image || null);

  // Rental pricing normalization
  const rawPricing = Array.isArray(raw.pricingRules) && raw.pricingRules.length > 0
    ? raw.pricingRules
    : Array.isArray(raw.rentalPricing)
    ? raw.rentalPricing
    : [];

  const rentalPricing = rawPricing.map((rule, idx) => {
    let durationValue = Number(rule.durationValue);
    let durationUnit = (rule.durationUnit || "day").toLowerCase();

    // If string duration exists (e.g. "1 Day", "3 Days")
    if ((!durationValue || isNaN(durationValue)) && typeof rule.duration === "string") {
      const match = rule.duration.trim().toLowerCase().match(/^(\d+)\s*(hour|day|week|month)s?$/);
      if (match) {
        durationValue = parseInt(match[1], 10);
        durationUnit = match[2];
      } else {
        durationValue = 1;
        durationUnit = "day";
      }
    }

    if (isNaN(durationValue) || durationValue < 1) durationValue = 1;

    const unitDisplay = durationUnit.charAt(0).toUpperCase() + durationUnit.slice(1);
    const durationLabel = rule.duration || `${durationValue} ${unitDisplay}${durationValue > 1 ? "s" : ""}`;

    return {
      id: rule.id || `pricing-${idx}`,
      duration: durationLabel,
      durationValue,
      durationUnit,
      pricelist: rule.pricelist || "Standard",
      price: Number(rule.price) || 0,
      isActive: rule.isActive !== false,
    };
  });

  // Additional charges normalization
  const resCharges = raw.reservationCharges || {};
  const extraHourCharge = typeof raw.extraHourCharge === "number"
    ? raw.extraHourCharge
    : Number(resCharges.extraHour) || 0;
  const extraDayCharge = typeof raw.extraDayCharge === "number"
    ? raw.extraDayCharge
    : Number(resCharges.extraDay) || 0;
  const additionalCharge = typeof raw.additionalCharge === "number"
    ? raw.additionalCharge
    : Number(resCharges.additionalCharge) || 0;

  const reservationCharges = {
    extraHour: extraHourCharge,
    extraDay: extraDayCharge,
    additionalCharge,
  };

  return {
    id,
    _id: raw._id,
    name,
    slug,
    sku,
    description,
    category,
    color,
    currency,
    price: basePrice,
    basePrice,
    status,
    isRentable,
    image: primaryImage,
    images,
    rentalPricing,
    pricingRules: rentalPricing,
    reservationCharges,
    extraHourCharge,
    extraDayCharge,
    additionalCharge,
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    stock: typeof raw.stock === "number" ? raw.stock : 10,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * 1. Fetch categories
 * First tries /api/v1/products/categories (standard backend endpoint).
 * Falls back to /api/v1/categories if needed.
 */
export async function fetchCategoriesApi() {
  try {
    const { data } = await api.get(`${PRODUCTS_BASE_URL}/categories`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      const { data } = await api.get("/api/v1/categories");
      return data;
    }
    throw err;
  }
}

/**
 * 2. List products with search, filters, sort, pagination
 */
export async function fetchProductsApi(params = {}) {
  const queryParams = {};

  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;
  if (params.q) queryParams.q = String(params.q).slice(0, 200);
  if (params.category && params.category !== "All Categories") {
    queryParams.category = params.category;
  }
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
  if (params.status) queryParams.status = params.status;
  if (params.minPrice !== undefined && params.minPrice !== "") {
    queryParams.minPrice = params.minPrice;
  }
  if (params.maxPrice !== undefined && params.maxPrice !== "") {
    queryParams.maxPrice = params.maxPrice;
  }
  if (params.isRentable !== undefined) queryParams.isRentable = params.isRentable;

  const { data } = await api.get(PRODUCTS_BASE_URL, { params: queryParams });
  return data;
}

/**
 * 3. Get single product by ID or slug
 */
export async function fetchProductByIdApi(productId) {
  const { data } = await api.get(`${PRODUCTS_BASE_URL}/${productId}`);
  return data;
}

/**
 * 4. Create new product (requires inventory.manage permission)
 */
export async function createProductApi(payload) {
  const { data } = await api.post(PRODUCTS_BASE_URL, payload);
  return data;
}

/**
 * 5. Update existing product (PATCH /api/v1/products/:productId)
 */
export async function updateProductApi(productId, payload) {
  const { data } = await api.patch(`${PRODUCTS_BASE_URL}/${productId}`, payload);
  return data;
}

/**
 * 6. Archive product (PATCH /api/v1/products/:productId/archive)
 */
export async function archiveProductApi(productId) {
  const { data } = await api.patch(`${PRODUCTS_BASE_URL}/${productId}/archive`);
  return data;
}
