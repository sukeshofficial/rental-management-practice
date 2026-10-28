import User, { USER_ROLES, USER_STATUS } from "../models/user.model.js";

/**
 * Registry of permitted staff roles and permitted permissions.
 */
export const ALLOWED_STAFF_ROLES = [USER_ROLES.INTERNAL_STAFF];

export const ALLOWED_PERMISSIONS = [
  "rental.read",
  "rental.operations",
  "inventory.read",
  "inventory.manage",
  "support.read",
  "support.manage",
  "orders.read",
  "orders.manage",
  "view:all_orders",
  "manage:internal_dashboard",
  "manage:staff_ops",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[0-9+\s\-().]{7,20}$/;

/**
 * Validates a batch of staff definitions before any database writes are initiated.
 * Strict preflight: If any entry fails validation, throws an Error with details.
 */
export const validateStaffBatch = (staffList, { allowPasswordEnvResolution = true } = {}) => {
  if (!Array.isArray(staffList) || staffList.length === 0) {
    const error = new Error("Staff list must be a non-empty array");
    error.statusCode = 400;
    throw error;
  }

  const seenEmails = new Set();
  const validatedList = [];

  for (let i = 0; i < staffList.length; i++) {
    const item = staffList[i];
    const index = i + 1;

    if (!item || typeof item !== "object") {
      const error = new Error(`Staff record #${index} must be an object`);
      error.statusCode = 400;
      throw error;
    }

    // Reject unrecognized properties that could attempt privilege escalation
    const allowedKeys = new Set([
      "name",
      "email",
      "phone",
      "role",
      "permissions",
      "password",
      "passwordEnv",
    ]);
    const unknownKeys = Object.keys(item).filter((key) => !allowedKeys.has(key));
    if (unknownKeys.length > 0) {
      const error = new Error(
        `Staff record #${index} contains unrecognized fields: ${unknownKeys.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Name validation
    if (!item.name || typeof item.name !== "string" || !item.name.trim()) {
      const error = new Error(`Staff record #${index} requires a non-empty 'name'`);
      error.statusCode = 400;
      throw error;
    }

    // Email validation & normalization
    if (!item.email || typeof item.email !== "string" || !EMAIL_REGEX.test(item.email.trim())) {
      const error = new Error(`Staff record #${index} has an invalid or missing 'email'`);
      error.statusCode = 400;
      throw error;
    }
    const normalizedEmail = item.email.trim().toLowerCase();

    // Duplicate email check within batch
    if (seenEmails.has(normalizedEmail)) {
      const error = new Error(
        `Staff record #${index} has duplicate email in batch: ${normalizedEmail}`
      );
      error.statusCode = 400;
      throw error;
    }
    seenEmails.add(normalizedEmail);

    // Phone validation
    if (!item.phone || typeof item.phone !== "string" || !PHONE_REGEX.test(item.phone.trim())) {
      const error = new Error(
        `Staff record #${index} has an invalid or missing 'phone' number`
      );
      error.statusCode = 400;
      throw error;
    }

    // Role validation
    const role = item.role || USER_ROLES.INTERNAL_STAFF;
    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      const error = new Error(
        `Staff record #${index} requested unsupported or unauthorized staff role '${role}'. Only '${ALLOWED_STAFF_ROLES.join(
          ", "
        )}' is permitted.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Permissions validation
    const permissions = Array.isArray(item.permissions) ? item.permissions : [];
    for (const perm of permissions) {
      if (typeof perm !== "string" || !ALLOWED_PERMISSIONS.includes(perm.trim())) {
        const error = new Error(
          `Staff record #${index} contains invalid permission '${perm}'. Permitted permissions: ${ALLOWED_PERMISSIONS.join(
            ", "
          )}`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // Password resolution & verification
    let resolvedPassword = item.password;
    if (!resolvedPassword && item.passwordEnv && allowPasswordEnvResolution) {
      resolvedPassword = process.env[item.passwordEnv];
      if (!resolvedPassword) {
        const error = new Error(
          `Staff record #${index} requires environment variable '${item.passwordEnv}', which is missing or empty`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (resolvedPassword && (typeof resolvedPassword !== "string" || resolvedPassword.length < 8)) {
      const error = new Error(
        `Staff record #${index} password must be at least 8 characters long`
      );
      error.statusCode = 400;
      throw error;
    }

    validatedList.push({
      name: item.name.trim(),
      email: normalizedEmail,
      phone: item.phone.trim(),
      role,
      permissions: permissions.map((p) => p.trim()),
      password: resolvedPassword || null,
    });
  }

  return validatedList;
};

/**
 * Shared staff provisioning service.
 * Used by both CLI and protected Administrator API.
 * Guarantees idempotent upsert with safe defaults:
 * - If account does not exist: creates with requested role, permissions, password.
 * - If account exists: preserves ID, role, permissions, status, and password unless explicit override flags are provided.
 */
export const provisionStaffBatch = async (
  validatedStaffList,
  {
    updateProfile = false,
    rotatePassword = false,
    syncPermissions = false,
    changeRole = false,
    reactivate = false,
  } = {}
) => {
  const summary = {
    total: validatedStaffList.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    results: [],
  };

  for (const item of validatedStaffList) {
    let user = await User.findOne({ email: item.email });

    if (!user) {
      if (!item.password) {
        const error = new Error(
          `Cannot create new staff account '${item.email}': No password or password secret provided.`
        );
        error.statusCode = 400;
        throw error;
      }

      user = new User({
        name: item.name,
        email: item.email,
        phone: item.phone,
        password: item.password, // Schema pre-save hook securely hashes password with bcrypt (cost 12)
        role: item.role,
        permissions: item.permissions,
        status: USER_STATUS.ACTIVE,
      });

      await user.save();

      summary.created++;
      summary.results.push({
        email: item.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
        action: "created",
      });
    } else {
      // Existing user: check if caller has privilege boundary violation
      if (user.role === USER_ROLES.ADMIN) {
        const error = new Error(
          `Account '${item.email}' is an Administrator. Staff provisioning cannot alter administrator accounts.`
        );
        error.statusCode = 403;
        throw error;
      }

      let hasModifications = false;

      // Profile updates
      if (updateProfile) {
        if (item.name && user.name !== item.name) {
          user.name = item.name;
          hasModifications = true;
        }
        if (item.phone && user.phone !== item.phone) {
          user.phone = item.phone;
          hasModifications = true;
        }
      }

      // Password rotation
      if (rotatePassword && item.password) {
        user.password = item.password; // Triggers pre-save hook to rehash
        hasModifications = true;
      }

      // Permissions synchronization
      if (syncPermissions) {
        const sortedExisting = [...(user.permissions || [])].sort().join(",");
        const sortedIncoming = [...item.permissions].sort().join(",");
        if (sortedExisting !== sortedIncoming) {
          user.permissions = item.permissions;
          hasModifications = true;
        }
      }

      // Role modification
      if (changeRole && item.role && user.role !== item.role) {
        user.role = item.role;
        hasModifications = true;
      }

      // Reactivation
      if (reactivate && user.status === USER_STATUS.DISABLED) {
        user.status = USER_STATUS.ACTIVE;
        hasModifications = true;
      }

      if (hasModifications) {
        await user.save();
        summary.updated++;
        summary.results.push({
          email: item.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
          action: "updated",
        });
      } else {
        summary.unchanged++;
        summary.results.push({
          email: item.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
          action: "unchanged",
        });
      }
    }
  }

  return summary;
};

/**
 * Bootstrap an initial administrator identity securely.
 * Checks INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD from environment.
 * Idempotent: Does nothing if administrator already exists.
 * Fails safely if configured email conflicts with a non-admin account.
 */
export const bootstrapInitialAdmin = async ({
  email = process.env.INITIAL_ADMIN_EMAIL,
  password = process.env.INITIAL_ADMIN_PASSWORD,
  name = "System Administrator",
  phone = "+1 555-0000",
} = {}) => {
  if (!email || !password) {
    throw new Error(
      "Initial administrator bootstrap requires both INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error(`Invalid INITIAL_ADMIN_EMAIL format: ${normalizedEmail}`);
  }

  if (password.length < 8) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be at least 8 characters long");
  }

  let existingAdmin = await User.findOne({ email: normalizedEmail });
  if (existingAdmin) {
    if (existingAdmin.role !== USER_ROLES.ADMIN) {
      throw new Error(
        `Conflict: Account with email '${normalizedEmail}' already exists but is not an administrator (role: ${existingAdmin.role}). Bootstrap aborted for security.`
      );
    }
    return {
      action: "unchanged",
      message: `Administrator account '${normalizedEmail}' already exists and is active.`,
      admin: existingAdmin.toSafeObject(),
    };
  }

  const admin = new User({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role: USER_ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    permissions: ["*"],
    emailVerified: true,
  });

  await admin.save();

  return {
    action: "created",
    message: `Initial administrator account '${normalizedEmail}' bootstrapped successfully.`,
    admin: admin.toSafeObject(),
  };
};
