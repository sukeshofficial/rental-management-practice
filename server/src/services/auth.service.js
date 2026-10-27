import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User, { USER_ROLES, USER_STATUS } from "../models/user.model.js";
import { sendPasswordResetEmail } from "./email.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_development_secret_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate signed JWT for authenticated user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token string
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Register a new customer.
 * Strict enforcement: Role is unconditionally set to 'customer'.
 * Client-supplied role, status, and permissions are rejected/ignored.
 */
export const registerCustomer = async ({ name, email, phone, password, confirmPassword }) => {
  if (!name || !email || !phone || !password) {
    const error = new Error("All fields (name, email, phone, password) are required");
    error.statusCode = 400;
    throw error;
  }

  if (confirmPassword && password !== confirmPassword) {
    const error = new Error("Password confirmation does not match");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  // Create user strictly with customer role and active status
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password, // Schema pre-save hook will hash this securely
    role: USER_ROLES.CUSTOMER,
    status: USER_STATUS.ACTIVE,
  });

  await user.save();
  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Authenticate user with email and password.
 * Uses generic error messages to prevent account enumeration.
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.status === USER_STATUS.DISABLED) {
    const error = new Error("Account is disabled. Please contact customer support.");
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Get profile for authenticated user ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.status === USER_STATUS.DISABLED) {
    const error = new Error("Account is disabled");
    error.statusCode = 403;
    throw error;
  }

  return user.toSafeObject();
};

/**
 * Update permitted profile fields.
 * Prevents mass-assignment of role, status, email, or password.
 * Returns updated user and any prohibited fields that were ignored.
 */
export const updateUserProfile = async (userId, updates = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Detect any prohibited fields attempted to be modified
  const prohibitedFieldsList = new Set([
    "role",
    "status",
    "email",
    "password",
    "passwordResetToken",
    "passwordResetExpires",
    "emailVerified",
    "id",
    "_id",
    "createdAt",
    "updatedAt",
  ]);

  const ignoredFields = Object.keys(updates).filter((key) =>
    prohibitedFieldsList.has(key)
  );

  // Only permit safe personal profile updates
  if (updates.name && typeof updates.name === "string" && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.phone && typeof updates.phone === "string" && updates.phone.trim()) {
    user.phone = updates.phone.trim();
  }

  await user.save();
  return {
    user: user.toSafeObject(),
    ignoredFields,
  };
};

/**
 * Request password recovery.
 * Generates an opaque crypto recovery token and expiration.
 * In production, outbound email sends the link.
 * For development/audit, returns a generic success message without leaking account existence.
 */
export const requestPasswordRecovery = async (email) => {
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.status !== USER_STATUS.DISABLED) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send secure password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken,
      });
    } catch (emailErr) {
      console.error("❌ Failed to send password reset email:", emailErr?.message);
      // Re-throw or log safely to ensure server resilience
    }
  }

  // Return generic response regardless of whether email exists to prevent enumeration
  return {
    message: "If an active account exists with that email address, a password recovery link has been sent.",
  };
};

/**
 * Reset password with a valid recovery token.
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  if (!token || !newPassword) {
    const error = new Error("Recovery token and new password are required");
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    const error = new Error("Invalid or expired password recovery token");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return {
    message: "Password has been reset successfully. Please log in with your new credentials.",
  };
};

/**
 * Verify whether a reset token is valid and unexpired without resetting the password yet.
 */
export const verifyResetToken = async (token) => {
  if (!token) return false;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });
  return Boolean(user);
};
