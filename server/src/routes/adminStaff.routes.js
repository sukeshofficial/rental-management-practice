import { Router } from "express";
import rateLimit from "express-rate-limit";
import { provisionStaff } from "../controllers/adminStaff.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter for privileged administrative operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many admin requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Route: POST /api/v1/admin/staff
 *
 * Protected: Requires a valid JWT (authenticate) AND the authenticated user's
 * email must be listed in the ADMIN_EMAILS environment variable (requireAdmin).
 *
 * Admin status is never inferred from the request body, query parameters, or JWT role claim.
 * It is determined solely by the server-controlled ADMIN_EMAILS whitelist in .env.
 */
router.post(
  "/",
  adminLimiter,
  authenticate,
  requireAdmin(),
  provisionStaff
);

export default router;
