import User, { USER_STATUS } from "../models/user.model.js";
import { verifyToken } from "../services/auth.service.js";

/**
 * Authentication Middleware:
 * Extracts JWT from HTTP-only cookie or Authorization header,
 * verifies signature and expiration, retrieves user, and attaches to req.user.
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
    req.user = user;
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
 * Permission Authorization Middleware:
 * Allows role-based permission policies. Defaults to deny.
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
    ],
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before permission verification.",
      });
    }

    const permittedActions = rolePermissions[req.user.role] || [];
    if (!permittedActions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Lacking permission '${permission}'.`,
      });
    }

    next();
  };
};
