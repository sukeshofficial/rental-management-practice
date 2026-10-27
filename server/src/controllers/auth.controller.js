import * as authService from "../services/auth.service.js";
import { authorizeOwnership } from "../services/ownership.service.js";

// Cookie options for secure session token delivery
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

/**
 * Public Customer Registration
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    const result = await authService.registerCustomer({
      name,
      email,
      phone,
      password,
      confirmPassword,
    });

    res.cookie("token", result.token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    res.cookie("token", result.token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/**
 * User Logout
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout error",
    });
  }
};

/**
 * Get Current User (GET /api/auth/me)
 */
export const getMe = async (req, res) => {
  try {
    const profile = await authService.getUserProfile(req.user._id);

    return res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

/**
 * Update Current User Profile (PATCH /api/auth/me)
 */
export const updateMe = async (req, res) => {
  try {
    const { user: updatedUser, ignoredFields } =
      await authService.updateUserProfile(req.user._id, req.body);

    const responsePayload = {
      success: true,
      message:
        ignoredFields.length > 0
          ? `Profile updated. Prohibited fields were ignored: ${ignoredFields.join(", ")}`
          : "Profile updated successfully",
      user: updatedUser,
    };

    if (ignoredFields.length > 0) {
      responsePayload.ignoredFields = ignoredFields;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordRecovery(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to process password recovery request",
    });
  }
};

/**
 * Reset Password (POST /api/v1/auth/reset-password)
 * Accepts { token, newPassword } or { token, password }
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, password } = req.body;
    const effectivePassword = newPassword || password;

    const result = await authService.resetPasswordWithToken(token, effectivePassword);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

/**
 * Validate Password Reset Token (GET /api/v1/auth/verify-reset-token)
 * Checks if the reset token exists and has not expired.
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Reset token is required",
      });
    }

    const isValid = await authService.verifyResetToken(token);
    return res.status(200).json({
      success: true,
      valid: isValid,
      message: isValid ? "Token is valid" : "Invalid or expired token",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      valid: false,
      message: error.message || "Failed to verify token",
    });
  }
};

/**
 * Staff-only Management Endpoint Demo (Protected by requireRole)
 */
export const staffDashboardOverview = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to Internal Staff Management Portal",
    data: {
      staffMember: req.user.name,
      staffEmail: req.user.email,
      role: req.user.role,
      activeRentalsCount: 0,
    },
  });
};

/**
 * Ownership test resource endpoint verifying customer isolation
 */
export const testCustomerResource = async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Verify authenticated user owns this resource or has internal_staff authority
    authorizeOwnership({
      resourceOwnerId: ownerId,
      authenticatedUser: req.user,
      allowStaff: true,
    });

    return res.status(200).json({
      success: true,
      message: "Customer resource accessed successfully",
      data: {
        resourceOwnerId: ownerId,
        content: `Private rental data for customer ${ownerId}`,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
