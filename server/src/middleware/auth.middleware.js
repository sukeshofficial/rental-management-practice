import User, { USER_STATUS } from "../models/user.model.js";
import { verifyToken } from "../services/auth.service.js";

/**
 * Reads the ADMIN_EMAILS environment variable and returns a Set of normalized
 * lowercase email addresses that are treated as administrators.
 *
 * Set via .env:
 *   ADMIN_EMAILS=admin@rental.com,ops.lead@rental.com
 *
 * SECURITY NOTES:
 * - Never trust a role supplied in the request body, query string, or JWT payload.
 * - Admin status is verified at runtime by comparing the authenticated user's email
 *   (fetched from the database) against the server-controlled ADMIN_EMAILS whitelist.
 * - Changing ADMIN_EMAILS requires a server restart and controlled deployment access.
 * - An empty or missing ADMIN_EMAILS means no user is ever granted admin access.
 */
const getAdminEmailSet = () => {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
};

/**
 * Checks whether an email address is in the server-controlled admin whitelist.
 * The whitelist is read fresh from the environment on each call so that
 * environment changes (within a process) are reflected immediately.
 */
export const isAdminEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return getAdminEmailSet().has(email.trim().toLowerCase());
};

/**
 * Authentication Middleware:
 * Extracts JWT from HTTP-only cookie or Authorization header,
 * verifies signature and expiration, retrieves the user from the database,
 * and attaches the trusted identity to req.user.
 *
 * Admin elevation:
 * After authenticating, if the user's database email matches any email in
 * ADMIN_EMAILS, req.user.isAdmin is set to true. This flag is set by the
 * server — it cannot be spoofed by the caller via request body, query param,
 * or JWT payload manipulation, because the email is fetched from the database.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication credentials.",
      });
    }

    // Always fetch from the database — never trust role/email in the JWT payload alone
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (user.status === USER_STATUS.DISABLED) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled. Access denied.",
      });
    }

    // Attach trusted identity to request object
    // Elevate to admin if the authenticated user's DB email is in ADMIN_EMAILS whitelist.
    // This is server-controlled and cannot be influenced by the caller.
    req.user = user;
    req.user.isAdmin = isAdminEmail(user.email);

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication processing error",
    });
  }
};

/**
 * Role Authorization Middleware:
 * Restricts access to one or more specified roles.
 * Rejects with 403 Forbidden if user lacks permitted role.
 * Note: use requireAdmin() for admin-only endpoints — it checks the env whitelist.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not possess the required role permissions.",
      });
    }

    next();
  };
};

/**
 * Admin Authorization Middleware:
 * Grants access only to users whose email is listed in ADMIN_EMAILS (.env).
 * This is the correct guard to use for all admin-only operations such as staff provisioning.
 *
 * SECURITY: Admin status is never determined by the request body or JWT role claim.
 * It is determined solely by matching the database user's email against the
 * server-controlled ADMIN_EMAILS whitelist.
 *
 * Non-admin users receive 403 Forbidden.
 */
export const requireAdmin = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Administrator access required.",
      });
    }

    next();
  };
};

/**
 * Permission Authorization Middleware:
 * Allows role-based permission policies. Defaults to deny.
 * Admin users (in ADMIN_EMAILS) bypass all permission checks.
 */
export const requirePermission = (permission) => {
  const rolePermissions = {
    customer: ["view:own_orders", "edit:own_profile"],
    end_user: ["view:assigned_orders", "view:own_profile"],
    internal_staff: [
      "view:all_orders",
      "manage:internal_dashboard",
      "manage:staff_ops",
      "view:own_profile",
      "edit:own_profile",
      "rental.read",
      "rental.operations",
      "inventory.read",
      "inventory.manage",
      "support.read",
      "support.manage",
      "orders.read",
      "orders.manage",
    ],
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before permission verification.",
      });
    }

    // Admin users (env-whitelist) bypass all permission checks
    if (req.user.isAdmin) {
      return next();
    }

    const permittedRoleActions = rolePermissions[req.user.role] || [];
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];

    const hasPermission =
      permittedRoleActions.includes(permission) ||
      permittedRoleActions.includes("*") ||
      userPermissions.includes(permission) ||
      userPermissions.includes("*");

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Lacking permission '${permission}'.`,
      });
    }

    next();
  };
};
