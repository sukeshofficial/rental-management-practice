import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  staffDashboardOverview,
  testCustomerResource,
} from "../controllers/auth.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter for authentication endpoints: max 50 requests per 15 mins (generous for tests, protective in prod)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public authentication routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/verify-reset-token", verifyResetToken);

// Development visual preview for email template
if (process.env.NODE_ENV !== "production") {
  router.get("/preview/password-reset", async (req, res) => {
    const { generatePasswordResetTemplate } = await import("../services/email.service.js");
    const sampleHtml = generatePasswordResetTemplate({
      name: req.query.name || "Alex Morgan",
      resetUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=sample_demo_token_1234567890abcdef&email=${encodeURIComponent(
        req.query.email || "alex.morgan@example.com"
      )}`,
      expirationHours: 1,
      year: new Date().getFullYear(),
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(sampleHtml);
  });
}

// Authenticated current-user routes
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

// Internal staff management routes (Protected by authentication + requireRole)
router.get("/staff/dashboard", authenticate, requireRole("internal_staff"), staffDashboardOverview);

// Customer-isolated resource demonstration route (Protected by authentication + ownership check)
router.get("/customer-resource/:ownerId", authenticate, testCustomerResource);

export default router;
