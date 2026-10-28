/**
 * Product Controller — F02
 *
 * Handles HTTP request/response for product endpoints.
 * Delegates all business logic to product.service.js.
 * Follows the existing controller pattern in auth.controller.js.
 */

import * as productService from "../services/product.service.js";

/**
 * GET /api/v1/products/categories
 * Returns the category list used by the UI dropdown.
 * Public — no authentication required.
 */
export const getCategories = async (req, res) => {
  try {
    const categories = productService.getCategories();
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

/**
 * GET /api/v1/products
 * List, search, filter, sort, and paginate products.
 * Public for active products; staff can see archived via ?status=archived.
 *
 * Query params:
 *   q, category, sortBy, sortOrder, page, limit,
 *   status (staff only), isRentable, minPrice, maxPrice
 */
export const listProducts = async (req, res) => {
  try {
    const isStaff = req.user
      ? req.user.isAdmin ||
        req.user.role === "internal_staff" ||
        (Array.isArray(req.user.permissions) &&
          req.user.permissions.includes("inventory.manage"))
      : false;

    const result = await productService.listProducts(req.query, isStaff);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

/**
 * GET /api/v1/products/:productId
 * Get a single product by its MongoDB ObjectId or slug.
 * Public for active products; archived products require staff access.
 */
export const getProduct = async (req, res) => {
  try {
    const isStaff = req.user
      ? req.user.isAdmin ||
        req.user.role === "internal_staff" ||
        (Array.isArray(req.user.permissions) &&
          req.user.permissions.includes("inventory.manage"))
      : false;

    const product = await productService.getProduct(
      req.params.productId,
      isStaff
    );

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

/**
 * POST /api/v1/products
 * Create a new rental product.
 * Requires authentication + inventory.manage permission.
 */
export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(
      req.body,
      req.user._id
    );

    return res.status(201).json({
      success: true,
      message: `Product "${product.name}" created successfully`,
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

/**
 * PATCH /api/v1/products/:productId
 * Update an existing product.
 * Requires authentication + inventory.manage permission.
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(
      req.params.productId,
      req.body,
      req.user._id
    );

    const response = {
      success: true,
      message: `Product "${product.name}" updated successfully`,
      product,
    };

    if (product._ignoredFields?.length > 0) {
      response.ignoredFields = product._ignoredFields;
      response.message += `. Prohibited fields were ignored: ${product._ignoredFields.join(", ")}`;
      delete product._ignoredFields;
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

/**
 * PATCH /api/v1/products/:productId/archive
 * Archive (soft-delete) a product.
 * Requires authentication + inventory.manage permission.
 */
export const archiveProduct = async (req, res) => {
  try {
    const product = await productService.archiveProduct(
      req.params.productId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: `Product "${product.name}" archived successfully`,
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to archive product",
    });
  }
};
