/**
 * Product Routes — F02
 *
 * Route pattern follows existing adminStaff.routes.js convention.
 * Middleware ordering: authenticate → requirePermission → controller
 *
 * Public endpoints (no auth required, but optionally uses token for staff view):
 *   GET /api/v1/products/categories
 *   GET /api/v1/products
 *   GET /api/v1/products/:productId
 *
 * Staff-only endpoints (require inventory.manage permission):
 *   POST   /api/v1/products
 *   PATCH  /api/v1/products/:productId
 *   PATCH  /api/v1/products/:productId/archive
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getCategories,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
} from "../controllers/product.controller.js";
import {
  authenticate,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter for write operations
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message:
      "Too many product write requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search/read operations (more generous)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Optional authentication middleware.
 * If a token is present and valid, populates req.user.
 * If no token or invalid token, silently continues without req.user.
 * This allows public routes to optionally provide staff-level data.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const { verifyToken } = await import("../services/auth.service.js");
    const { default: User } = await import("../models/user.model.js");
    const { isAdminEmail } = await import("../middleware/auth.middleware.js");

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next(); // Invalid token — continue without auth
    }

    const user = await User.findById(decoded.id);
    if (user && user.status === "active") {
      req.user = user;
      req.user.isAdmin = isAdminEmail(user.email);
    }
    next();
  } catch {
    next(); // Never block public routes due to optional auth errors
  }
}

// ─── Public read routes ───────────────────────────────────────────────────────

/**
 * GET /api/v1/products/categories
 * Must come BEFORE /:productId to avoid route collision.
 */
router.get("/categories", readLimiter, getCategories);

/**
 * GET /api/v1/products
 * List products with search, filter, sort, pagination.
 * Public but optionally authenticated (staff sees archived).
 */
router.get("/", readLimiter, optionalAuthenticate, listProducts);

/**
 * GET /api/v1/products/:productId
 * Get single product by ID or slug.
 */
router.get("/:productId", readLimiter, optionalAuthenticate, getProduct);

// ─── Staff-only write routes ──────────────────────────────────────────────────

/**
 * POST /api/v1/products
 * Create a new product.
 */
router.post(
  "/",
  writeLimiter,
  authenticate,
  requirePermission("inventory.manage"),
  createProduct
);

/**
 * PATCH /api/v1/products/:productId/archive
 * Archive a product.
 * Must come before /:productId PATCH to avoid Express matching this as productId="archive".
 */
router.patch(
  "/:productId/archive",
  writeLimiter,
  authenticate,
  requirePermission("inventory.manage"),
  archiveProduct
);

/**
 * PATCH /api/v1/products/:productId
 * Update a product.
 */
router.patch(
  "/:productId",
  writeLimiter,
  authenticate,
  requirePermission("inventory.manage"),
  updateProduct
);

export default router;
