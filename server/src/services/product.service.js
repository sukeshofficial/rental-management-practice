/**
 * Product Service — F02
 *
 * Handles all product business logic:
 *   - Creation, update, archive
 *   - Listing with filtering, sorting, pagination
 *   - Search delegation to search.service.js
 *   - Payload normalization (frontend ↔ backend field mapping)
 */

import Product, {
  VALID_CATEGORIES,
  VALID_PRICELISTS,
  VALID_DURATION_UNITS,
  PRODUCT_STATUS,
} from "../models/product.model.js";
import { sanitizeQuery, executeProductSearch } from "./search.service.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

const VALID_SORT_FIELDS = ["name", "price", "createdAt", "updatedAt"];
const VALID_SORT_ORDERS = ["asc", "desc"];

// ─── Duration string parser ───────────────────────────────────────────────────
// Converts frontend duration strings (e.g. "1 Day", "3 Days", "1 Week")
// into { durationValue: number, durationUnit: string } pairs.
const DURATION_PARSE_MAP = {
  "1 hour": { durationValue: 1, durationUnit: "hour" },
  "2 hours": { durationValue: 2, durationUnit: "hour" },
  "4 hours": { durationValue: 4, durationUnit: "hour" },
  "1 day": { durationValue: 1, durationUnit: "day" },
  "2 days": { durationValue: 2, durationUnit: "day" },
  "3 days": { durationValue: 3, durationUnit: "day" },
  "1 week": { durationValue: 1, durationUnit: "week" },
  "1 month": { durationValue: 1, durationUnit: "month" },
};

/**
 * Parse a duration string or already-structured duration object.
 * Accepts:
 *   - string: "1 Day", "3 Days", "1 Week" (case-insensitive)
 *   - object: { durationValue, durationUnit } (pass-through)
 * @param {string|object} raw
 * @returns {{ durationValue: number, durationUnit: string }}
 */
function parseDuration(raw) {
  if (raw && typeof raw === "object" && raw.durationValue && raw.durationUnit) {
    const unit = String(raw.durationUnit).toLowerCase();
    if (!VALID_DURATION_UNITS.includes(unit)) {
      const err = new Error(`Invalid duration unit: ${raw.durationUnit}`);
      err.statusCode = 400;
      throw err;
    }
    const val = Number(raw.durationValue);
    if (!Number.isInteger(val) || val < 1) {
      const err = new Error("Duration value must be a positive integer");
      err.statusCode = 400;
      throw err;
    }
    return { durationValue: val, durationUnit: unit };
  }

  if (typeof raw === "string") {
    const key = raw.trim().toLowerCase();
    const parsed = DURATION_PARSE_MAP[key];
    if (parsed) return parsed;

    // Try to parse "N Unit" or "N Units" format dynamically
    const match = key.match(/^(\d+)\s+(hour|day|week|month)s?$/);
    if (match) {
      return {
        durationValue: parseInt(match[1], 10),
        durationUnit: match[2],
      };
    }
  }

  const err = new Error(
    `Unrecognized duration format: "${raw}". Use "1 Hour", "1 Day", "3 Days", "1 Week", "1 Month", or { durationValue, durationUnit }`
  );
  err.statusCode = 400;
  throw err;
}

// ─── Payload normalization ────────────────────────────────────────────────────

/**
 * Normalize image input from frontend.
 * Frontend sends images as an array of URL strings or as image objects.
 * @param {Array} rawImages
 * @returns {Array<{ url, alt, sortOrder }>}
 */
function normalizeImages(rawImages) {
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .filter(Boolean)
    .map((img, idx) => {
      if (typeof img === "string") {
        return { url: img.trim(), alt: "", sortOrder: idx };
      }
      if (typeof img === "object" && img.url) {
        return {
          url: String(img.url).trim(),
          alt: img.alt ? String(img.alt).trim() : "",
          sortOrder: img.sortOrder !== undefined ? Number(img.sortOrder) : idx,
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Normalize pricing rules from frontend format.
 * Frontend sends: { id, duration, pricelist, price }
 * Backend expects: { durationValue, durationUnit, pricelist, price, isActive }
 * @param {Array} rawRules
 * @returns {Array}
 */
function normalizePricingRules(rawRules) {
  if (!Array.isArray(rawRules)) return [];
  return rawRules.map((rule, idx) => {
    // Parse duration — accept both string ("1 Day") and object form
    const durationSource = rule.duration || rule;
    const { durationValue, durationUnit } = parseDuration(durationSource);

    const priceNum = Number(rule.price);
    if (isNaN(priceNum) || priceNum < 0) {
      const err = new Error(
        `Rule ${idx + 1}: price must be a non-negative number`
      );
      err.statusCode = 400;
      throw err;
    }

    if (!VALID_PRICELISTS.includes(rule.pricelist)) {
      const err = new Error(
        `Rule ${idx + 1}: "${rule.pricelist}" is not a valid pricelist. Valid options: ${VALID_PRICELISTS.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }

    return {
      durationValue,
      durationUnit,
      pricelist: rule.pricelist,
      price: priceNum,
      isActive: rule.isActive !== false,
    };
  });
}

/**
 * Auto-generate a SKU from a product name if no SKU is provided.
 * Format: <CATEGORY_PREFIX>-<NAME_ABBR>-<TIMESTAMP>
 * @param {string} name
 * @param {string} category
 * @returns {string}
 */
function generateSku(name, category) {
  const categoryPrefixes = {
    "Cameras & Accessories": "CAM",
    "Power Tools": "TOOL",
    "AV Equipment": "AV",
    "Furniture & Event": "FURN",
    "Cleaning & Outdoor": "CLN",
    "Camping & Adventure": "CAMP",
    "Audio & DJ": "AUD",
  };
  const prefix = categoryPrefixes[category] || "PROD";
  const nameAbbr = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 10);
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${nameAbbr}-${ts}`;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validatePositivePage(page) {
  const p = parseInt(page, 10);
  if (isNaN(p) || p < 1) return 1;
  return p;
}

function validateLimit(limit) {
  const l = parseInt(limit, 10);
  if (isNaN(l) || l < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(l, MAX_PAGE_SIZE);
}

function validateSortBy(sortBy) {
  if (!sortBy) return "name";
  // Accept frontend-style combined "name-asc" or separate "name"
  const base = sortBy.split("-")[0];
  if (!VALID_SORT_FIELDS.includes(base)) {
    const err = new Error(
      `Invalid sort field: "${base}". Valid fields: ${VALID_SORT_FIELDS.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }
  return base;
}

function validateSortOrder(sortOrder, sortBy) {
  // Accept combined format "name-asc" → extract order
  if (!sortOrder && sortBy && sortBy.includes("-")) {
    const parts = sortBy.split("-");
    sortOrder = parts[parts.length - 1];
  }
  if (!sortOrder) return "asc";
  const o = sortOrder.toLowerCase();
  if (!VALID_SORT_ORDERS.includes(o)) {
    const err = new Error(
      `Invalid sort order: "${o}". Use "asc" or "desc"`
    );
    err.statusCode = 400;
    throw err;
  }
  return o;
}

/**
 * Build a Mongoose sort object from validated sort parameters.
 * Always includes a secondary stable sort on _id to prevent page jumps.
 * Note: "price" sorts on basePrice.
 * @param {string} field
 * @param {string} order
 * @returns {object}
 */
function buildSortObject(field, order) {
  const dir = order === "desc" ? -1 : 1;
  const mongoField = field === "price" ? "basePrice" : field;
  return { [mongoField]: dir, _id: dir };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new product.
 * @param {object} payload   Request body fields
 * @param {object} creatorId Authenticated user's _id
 * @returns {Promise<object>} Created product (safe JSON)
 */
export async function createProduct(payload, creatorId) {
  const {
    name,
    sku,
    description = "",
    category,
    color = "",
    images = [],
    keywords = [],
    isRentable = true,
    price,      // frontend field name
    basePrice,  // backend field name (also accepted)
    currency = "INR",
    pricingRules = [],
    rentalPricing = [],
    reservationCharges = {},
    extraHourCharge,
    extraDayCharge,
    additionalCharge,
    status = PRODUCT_STATUS.ACTIVE,
  } = payload;

  // ── Field validation ─────────────────────────────────────────────────────

  if (!name || !String(name).trim()) {
    const err = new Error("Product name is required");
    err.statusCode = 400;
    throw err;
  }

  const resolvedBasePrice = basePrice !== undefined ? basePrice : price;
  if (resolvedBasePrice === undefined || resolvedBasePrice === null || resolvedBasePrice === "") {
    const err = new Error("Base price is required");
    err.statusCode = 400;
    throw err;
  }
  const basePriceNum = Number(resolvedBasePrice);
  if (isNaN(basePriceNum) || basePriceNum < 0) {
    const err = new Error("Base price must be a non-negative number");
    err.statusCode = 400;
    throw err;
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    const err = new Error(
      `Invalid category: "${category}". Valid categories: ${VALID_CATEGORIES.join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Validate keywords
  if (!Array.isArray(keywords) || keywords.length > 30) {
    const err = new Error("keywords must be an array with at most 30 entries");
    err.statusCode = 400;
    throw err;
  }
  for (const kw of keywords) {
    if (typeof kw !== "string" || kw.length > 100) {
      const err = new Error("Each keyword must be a string of at most 100 characters");
      err.statusCode = 400;
      throw err;
    }
  }

  // ── Normalize images ─────────────────────────────────────────────────────
  const normalizedImages = normalizeImages(images);

  // ── Normalize pricing rules ───────────────────────────────────────────────
  // Accept either pricingRules (frontend format) or rentalPricing (backend format)
  const rawRules = pricingRules.length > 0 ? pricingRules : rentalPricing;
  const normalizedRules = normalizePricingRules(rawRules);

  // ── Resolve charge fields ─────────────────────────────────────────────────
  const resolvedExtraHour = Number(
    extraHourCharge !== undefined
      ? extraHourCharge
      : reservationCharges.extraHour ?? 0
  );
  const resolvedExtraDay = Number(
    extraDayCharge !== undefined
      ? extraDayCharge
      : reservationCharges.extraDay ?? 0
  );
  const resolvedAdditional = Number(
    additionalCharge !== undefined
      ? additionalCharge
      : reservationCharges.additionalCharge ?? 0
  );

  if ([resolvedExtraHour, resolvedExtraDay, resolvedAdditional].some((v) => isNaN(v) || v < 0)) {
    const err = new Error("Charge values must be non-negative numbers");
    err.statusCode = 400;
    throw err;
  }

  // ── Resolve or generate SKU ───────────────────────────────────────────────
  const resolvedSku = sku
    ? String(sku).trim()
    : generateSku(name, category);

  // ── Create product ────────────────────────────────────────────────────────
  const product = new Product({
    name: name.trim(),
    sku: resolvedSku,
    description: description ? String(description).trim() : "",
    category,
    color: color ? String(color).trim() : "",
    images: normalizedImages,
    keywords: keywords.map((k) => String(k).trim()).filter(Boolean),
    isRentable: Boolean(isRentable),
    status: Object.values(PRODUCT_STATUS).includes(status)
      ? status
      : PRODUCT_STATUS.ACTIVE,
    basePrice: basePriceNum,
    currency: currency || "INR",
    rentalPricing: normalizedRules,
    extraHourCharge: resolvedExtraHour,
    extraDayCharge: resolvedExtraDay,
    additionalCharge: resolvedAdditional,
    createdBy: creatorId,
    updatedBy: creatorId,
  });

  try {
    await product.save();
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const duplicate = new Error(
        field === "sku"
          ? `A product with SKU "${resolvedSku}" already exists`
          : `A product with that ${field} already exists`
      );
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw err;
  }

  return product.toJSON();
}

/**
 * Get a paginated, filtered, sorted, and searchable list of products.
 * @param {object} params
 * @param {boolean} isStaff  If true, archived products can be queried
 * @returns {Promise<object>}
 */
export async function listProducts(params = {}, isStaff = false) {
  const {
    q,
    category,
    sortBy: rawSortBy = "name",
    sortOrder: rawSortOrder = "asc",
    page: rawPage = 1,
    limit: rawLimit = DEFAULT_PAGE_SIZE,
    status,
    isRentable,
    minPrice,
    maxPrice,
  } = params;

  // ── Validate pagination and sort ─────────────────────────────────────────
  const page = validatePositivePage(rawPage);
  const limit = validateLimit(rawLimit);
  const sortByField = validateSortBy(rawSortBy);
  const sortOrder = validateSortOrder(rawSortOrder, rawSortBy);

  // ── Build base filter ─────────────────────────────────────────────────────
  const baseFilter = {};

  // Status filtering: public gets only active; staff can optionally see archived
  if (isStaff && status && Object.values(PRODUCT_STATUS).includes(status)) {
    baseFilter.status = status;
  } else {
    baseFilter.status = PRODUCT_STATUS.ACTIVE;
  }

  // Category filter (validated)
  if (category && category !== "All Categories") {
    if (!VALID_CATEGORIES.includes(category)) {
      const err = new Error(`Invalid category filter: "${category}"`);
      err.statusCode = 400;
      throw err;
    }
    baseFilter.category = category;
  }

  // isRentable filter
  if (isRentable !== undefined && isRentable !== "") {
    const rentableVal =
      isRentable === "true" || isRentable === true ? true : false;
    baseFilter.isRentable = rentableVal;
  }

  // Price range filter (applies to basePrice)
  if (minPrice !== undefined && minPrice !== "") {
    const min = Number(minPrice);
    if (!isNaN(min) && min >= 0) {
      baseFilter.basePrice = { ...(baseFilter.basePrice || {}), $gte: min };
    }
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    const max = Number(maxPrice);
    if (!isNaN(max) && max >= 0) {
      baseFilter.basePrice = { ...(baseFilter.basePrice || {}), $lte: max };
    }
  }

  const sortObject = buildSortObject(sortByField, sortOrder);

  // ── Search path ───────────────────────────────────────────────────────────
  const sanitizedQuery = sanitizeQuery(q);

  if (sanitizedQuery) {
    // Delegate to search service
    const sortOverride = rawSortBy !== "name" || rawSortOrder !== "asc"
      ? sortObject
      : null; // Let relevance score govern default search order

    const { products, total } = await executeProductSearch({
      query: sanitizedQuery,
      baseFilter,
      sortOverride,
      page,
      limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      products: products.map(formatProduct),
      pagination: { page, limit, total, totalPages },
      filters: {
        q: sanitizedQuery,
        category: category || null,
        sortBy: sortByField,
        sortOrder,
      },
    };
  }

  // ── No-search path (direct filter + sort) ────────────────────────────────
  const total = await Product.countDocuments(baseFilter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;

  const products = await Product.find(baseFilter)
    .sort(sortObject)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    products: products.map(formatProduct),
    pagination: { page, limit, total, totalPages },
    filters: {
      q: null,
      category: category || null,
      sortBy: sortByField,
      sortOrder,
    },
  };
}

/**
 * Get a single product by its ID or slug.
 * @param {string} productIdOrSlug  Mongo ObjectId or URL slug
 * @param {boolean} isStaff
 * @returns {Promise<object>}
 */
export async function getProduct(productIdOrSlug, isStaff = false) {
  let product = null;

  // Try by ObjectId first
  const isValidObjectId = /^[a-f\d]{24}$/i.test(productIdOrSlug);
  if (isValidObjectId) {
    product = await Product.findById(productIdOrSlug).lean();
  }

  // Fallback: try by slug
  if (!product) {
    product = await Product.findOne({ slug: productIdOrSlug }).lean();
  }

  if (!product) {
    const err = new Error(`Product not found: "${productIdOrSlug}"`);
    err.statusCode = 404;
    throw err;
  }

  // Archived products are hidden from non-staff
  if (product.status === PRODUCT_STATUS.ARCHIVED && !isStaff) {
    const err = new Error(`Product not found: "${productIdOrSlug}"`);
    err.statusCode = 404;
    throw err;
  }

  return formatProduct(product);
}

/**
 * Update permitted fields on an existing product.
 * Preserves fields not included in the update payload.
 * @param {string} productId
 * @param {object} payload
 * @param {string} updaterId  Authenticated user's _id
 * @returns {Promise<object>}
 */
export async function updateProduct(productId, payload, updaterId) {
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error(`Product not found: "${productId}"`);
    err.statusCode = 404;
    throw err;
  }

  // ── Allowed update fields (prevent mass-assignment) ───────────────────────
  const PERMITTED = [
    "name",
    "description",
    "category",
    "color",
    "images",
    "keywords",
    "isRentable",
    "status",
    "price",       // frontend alias for basePrice
    "basePrice",
    "currency",
    "pricingRules",  // frontend alias for rentalPricing
    "rentalPricing",
    "reservationCharges",
    "extraHourCharge",
    "extraDayCharge",
    "additionalCharge",
    "sku",
  ];

  const ignoredFields = Object.keys(payload).filter(
    (k) => !PERMITTED.includes(k)
  );

  // Apply permitted updates
  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) {
      const err = new Error("Product name cannot be empty");
      err.statusCode = 400;
      throw err;
    }
    product.name = name;
  }

  if (payload.description !== undefined) {
    product.description = String(payload.description).trim();
  }

  if (payload.category !== undefined) {
    if (!VALID_CATEGORIES.includes(payload.category)) {
      const err = new Error(`Invalid category: "${payload.category}"`);
      err.statusCode = 400;
      throw err;
    }
    product.category = payload.category;
  }

  if (payload.color !== undefined) {
    product.color = String(payload.color).trim();
  }

  if (payload.images !== undefined) {
    product.images = normalizeImages(payload.images);
  }

  if (payload.keywords !== undefined) {
    if (!Array.isArray(payload.keywords) || payload.keywords.length > 30) {
      const err = new Error("keywords must be an array with at most 30 entries");
      err.statusCode = 400;
      throw err;
    }
    product.keywords = payload.keywords.map((k) => String(k).trim()).filter(Boolean);
  }

  if (payload.isRentable !== undefined) {
    product.isRentable = Boolean(payload.isRentable);
  }

  if (payload.status !== undefined) {
    if (!Object.values(PRODUCT_STATUS).includes(payload.status)) {
      const err = new Error(`Invalid status: "${payload.status}"`);
      err.statusCode = 400;
      throw err;
    }
    product.status = payload.status;
  }

  const priceSource = payload.basePrice !== undefined ? payload.basePrice : payload.price;
  if (priceSource !== undefined) {
    const pn = Number(priceSource);
    if (isNaN(pn) || pn < 0) {
      const err = new Error("Base price must be a non-negative number");
      err.statusCode = 400;
      throw err;
    }
    product.basePrice = pn;
  }

  if (payload.currency !== undefined) {
    product.currency = String(payload.currency).trim();
  }

  // Pricing rules
  const rulesSource = payload.pricingRules || payload.rentalPricing;
  if (rulesSource !== undefined) {
    product.rentalPricing = normalizePricingRules(rulesSource);
  }

  // Charges
  const charges = payload.reservationCharges;
  if (payload.extraHourCharge !== undefined) {
    product.extraHourCharge = Number(payload.extraHourCharge);
  } else if (charges?.extraHour !== undefined) {
    product.extraHourCharge = Number(charges.extraHour);
  }

  if (payload.extraDayCharge !== undefined) {
    product.extraDayCharge = Number(payload.extraDayCharge);
  } else if (charges?.extraDay !== undefined) {
    product.extraDayCharge = Number(charges.extraDay);
  }

  if (payload.additionalCharge !== undefined) {
    product.additionalCharge = Number(payload.additionalCharge);
  } else if (charges?.additionalCharge !== undefined) {
    product.additionalCharge = Number(charges.additionalCharge);
  }

  if (payload.sku !== undefined) {
    product.sku = String(payload.sku).trim();
  }

  product.updatedBy = updaterId;

  try {
    await product.save();
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const duplicate = new Error(
        field === "sku"
          ? `A product with SKU "${product.sku}" already exists`
          : `A product with that ${field} already exists`
      );
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw err;
  }

  const result = product.toJSON();
  if (ignoredFields.length > 0) {
    result._ignoredFields = ignoredFields;
  }
  return result;
}

/**
 * Archive a product (soft-delete).
 * Products referenced by rental records are preserved — only status changes.
 * @param {string} productId
 * @param {string} updaterId
 * @returns {Promise<object>}
 */
export async function archiveProduct(productId, updaterId) {
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error(`Product not found: "${productId}"`);
    err.statusCode = 404;
    throw err;
  }

  if (product.status === PRODUCT_STATUS.ARCHIVED) {
    const err = new Error("Product is already archived");
    err.statusCode = 409;
    throw err;
  }

  product.status = PRODUCT_STATUS.ARCHIVED;
  product.updatedBy = updaterId;
  await product.save();

  return product.toJSON();
}

/**
 * Get the category list for the UI dropdown.
 * Returns an array of { label, value } objects plus an "All Categories" option.
 * @returns {Array<{ label: string, value: string }>}
 */
export function getCategories() {
  return [
    { label: "All Categories", value: "All Categories" },
    ...VALID_CATEGORIES.map((c) => ({ label: c, value: c })),
  ];
}

// ─── Response formatting ──────────────────────────────────────────────────────

/**
 * Format a lean (plain) product object into the frontend-compatible shape.
 * Strips internal fields and maps backend names to frontend field names.
 * @param {object} p  Plain product object from .lean()
 * @returns {object}
 */
function formatProduct(p) {
  return {
    id: p._id ? p._id.toString() : p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    category: p.category,
    color: p.color,
    images: p.images || [],
    // Primary image URL for quick card display (first image)
    image: p.images?.[0]?.url || null,
    keywords: p.keywords || [],
    isRentable: p.isRentable,
    status: p.status,
    // "price" is the frontend display name for basePrice
    price: p.basePrice,
    basePrice: p.basePrice,
    currency: p.currency,
    // pricingRules is the frontend name; include both for compatibility
    rentalPricing: p.rentalPricing || [],
    pricingRules: (p.rentalPricing || []).map((rule) => ({
      duration: formatDuration(rule.durationValue, rule.durationUnit),
      durationValue: rule.durationValue,
      durationUnit: rule.durationUnit,
      pricelist: rule.pricelist,
      price: rule.price,
      isActive: rule.isActive,
    })),
    reservationCharges: {
      extraHour: p.extraHourCharge ?? 0,
      extraDay: p.extraDayCharge ?? 0,
      additionalCharge: p.additionalCharge ?? 0,
    },
    extraHourCharge: p.extraHourCharge ?? 0,
    extraDayCharge: p.extraDayCharge ?? 0,
    additionalCharge: p.additionalCharge ?? 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Format { durationValue, durationUnit } back to a human-readable duration string.
 * @param {number} value
 * @param {string} unit
 * @returns {string}
 */
function formatDuration(value, unit) {
  if (!value || !unit) return "";
  const unitDisplay = unit.charAt(0).toUpperCase() + unit.slice(1);
  return `${value} ${unitDisplay}${value > 1 ? "s" : ""}`;
}
