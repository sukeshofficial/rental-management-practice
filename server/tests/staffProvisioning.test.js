/**
 * Tests: Staff Provisioning Service
 * Tests: Admin Staff API (authorization)
 * Tests: Regression (public auth, login, logout)
 *
 * Uses Node.js built-in test runner (node --test)
 * Run: npm test
 */

import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import mongoose from "mongoose";
import User, { USER_ROLES, USER_STATUS } from "../src/models/user.model.js";
import connectDB from "../src/config/db.js";
import {
  validateStaffBatch,
  provisionStaffBatch,
  ALLOWED_STAFF_ROLES,
  ALLOWED_PERMISSIONS,
} from "../src/services/staffProvisioning.service.js";
import { isAdminEmail } from "../src/middleware/auth.middleware.js";

// ─────────────────────────────────────────────
// TEST DB SETUP
// ─────────────────────────────────────────────

const TEST_MONGO_URI =
  process.env.TEST_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/rental-management-test";

const cleanupTestEmails = async (...emails) => {
  for (const email of emails) {
    await User.deleteMany({ email: email.toLowerCase().trim() });
  }
};

before(async () => {
  process.env.MONGODB_URI = TEST_MONGO_URI;
  await connectDB();
  // Cleanup any leftover test users from a previous run
  await cleanupTestEmails(
    "cli.staff.test@test.local",
    "cli.staff2.test@test.local",
    "admin.test@test.local",
    "customer.test@test.local"
  );
});

after(async () => {
  await cleanupTestEmails(
    "cli.staff.test@test.local",
    "cli.staff2.test@test.local",
    "admin.test@test.local",
    "customer.test@test.local"
  );
  await mongoose.disconnect();
});

// ─────────────────────────────────────────────
// 1. PROVISIONING SERVICE — VALIDATION UNIT TESTS
// ─────────────────────────────────────────────

describe("validateStaffBatch — preflight validation", () => {
  it("accepts a valid batch with single staff", () => {
    const result = validateStaffBatch([
      {
        name: "Test Staff",
        email: "valid@test.local",
        phone: "+91 9876543210",
        role: "internal_staff",
        permissions: ["rental.read"],
        password: "SecurePass@123",
      },
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].email, "valid@test.local");
    assert.equal(result[0].role, USER_ROLES.INTERNAL_STAFF);
  });

  it("normalizes email to lowercase", () => {
    const result = validateStaffBatch([
      {
        name: "Test",
        email: "UPPER@Test.LOCAL",
        phone: "+91 9876543210",
        password: "SecurePass@123",
      },
    ]);
    assert.equal(result[0].email, "upper@test.local");
  });

  it("rejects batch with empty array", () => {
    assert.throws(
      () => validateStaffBatch([]),
      /non-empty array/i
    );
  });

  it("rejects record with missing name", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          { email: "a@test.local", phone: "+91 9876543210", password: "Pass@123!" },
        ]),
      /name/i
    );
  });

  it("rejects record with invalid email", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          { name: "Test", email: "not-an-email", phone: "+91 9876543210", password: "Pass@123!" },
        ]),
      /email/i
    );
  });

  it("rejects duplicate emails within the same batch", () => {
    const entry = {
      name: "Test",
      email: "dup@test.local",
      phone: "+91 9876543210",
      password: "Pass@123!",
    };
    assert.throws(
      () => validateStaffBatch([entry, { ...entry }]),
      /duplicate/i
    );
  });

  it("rejects unknown / unauthorized role", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          {
            name: "Test",
            email: "a@test.local",
            phone: "+91 9876543210",
            password: "Pass@123!",
            role: "admin",
          },
        ]),
      /unauthorized staff role/i
    );
  });

  it("rejects customer role (not allowed for staff provisioning)", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          {
            name: "Test",
            email: "a@test.local",
            phone: "+91 9876543210",
            password: "Pass@123!",
            role: "customer",
          },
        ]),
      /unauthorized staff role/i
    );
  });

  it("rejects unknown permissions", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          {
            name: "Test",
            email: "a@test.local",
            phone: "+91 9876543210",
            password: "Pass@123!",
            permissions: ["can.hack.everything"],
          },
        ]),
      /invalid permission/i
    );
  });

  it("rejects missing passwordEnv when env var is absent", () => {
    const originalValue = process.env["NONEXISTENT_TEST_ENV_12345"];
    delete process.env["NONEXISTENT_TEST_ENV_12345"];
    assert.throws(
      () =>
        validateStaffBatch(
          [
            {
              name: "Test",
              email: "a@test.local",
              phone: "+91 9876543210",
              passwordEnv: "NONEXISTENT_TEST_ENV_12345",
            },
          ],
          { allowPasswordEnvResolution: true }
        ),
      /environment variable/i
    );
    if (originalValue !== undefined) process.env["NONEXISTENT_TEST_ENV_12345"] = originalValue;
  });

  it("rejects password shorter than 8 characters", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          { name: "Test", email: "a@test.local", phone: "+91 9876543210", password: "Short1" },
        ]),
      /at least 8/i
    );
  });

  it("rejects unrecognized fields that could attempt privilege escalation", () => {
    assert.throws(
      () =>
        validateStaffBatch([
          {
            name: "Test",
            email: "a@test.local",
            phone: "+91 9876543210",
            password: "Pass@123!",
            isAdmin: true,
          },
        ]),
      /unrecognized fields/i
    );
  });
});

// ─────────────────────────────────────────────
// 2. PROVISIONING SERVICE — IDEMPOTENT UPSERT
// ─────────────────────────────────────────────

describe("provisionStaffBatch — idempotent upsert", () => {
  afterEach(async () => {
    await cleanupTestEmails(
      "cli.staff.test@test.local",
      "cli.staff2.test@test.local"
    );
  });

  it("creates new staff account", async () => {
    const batch = [
      {
        name: "CLI Staff Test",
        email: "cli.staff.test@test.local",
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: ["rental.read"],
        password: "SecurePass@123",
      },
    ];
    const summary = await provisionStaffBatch(batch);
    assert.equal(summary.created, 1);
    assert.equal(summary.updated, 0);
    assert.equal(summary.results[0].action, "created");

    const user = await User.findOne({ email: "cli.staff.test@test.local" }).select("+password");
    assert.ok(user, "User should exist in DB");
    assert.equal(user.role, USER_ROLES.INTERNAL_STAFF);
    assert.equal(user.status, USER_STATUS.ACTIVE);

    // Password must be hashed (never stored as plaintext)
    assert.notEqual(user.password, "SecurePass@123", "Password must not be stored as plaintext");
    assert.ok(user.password.startsWith("$2"), "Password should be a bcrypt hash");

    // Password hash must be verifiable
    const isMatch = await user.comparePassword("SecurePass@123");
    assert.ok(isMatch, "Hashed password must match original via comparePassword");
  });

  it("does not duplicate on rerun (idempotent)", async () => {
    const batch = [
      {
        name: "CLI Staff Test",
        email: "cli.staff.test@test.local",
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: [],
        password: "SecurePass@123",
      },
    ];
    await provisionStaffBatch(batch);
    const summary2 = await provisionStaffBatch(batch);
    assert.equal(summary2.created, 0);
    assert.equal(summary2.results[0].action, "unchanged");

    const count = await User.countDocuments({ email: "cli.staff.test@test.local" });
    assert.equal(count, 1);
  });

  it("does NOT rotate password on rerun without --rotate-password flag", async () => {
    const email = "cli.staff.test@test.local";
    const batch = [
      {
        name: "CLI Staff Test",
        email,
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: [],
        password: "OriginalPass@123",
      },
    ];
    await provisionStaffBatch(batch);

    // Rerun with different password but no rotatePassword flag
    const batch2 = [{ ...batch[0], password: "NewPass@456!" }];
    await provisionStaffBatch(batch2, { rotatePassword: false });

    const user = await User.findOne({ email }).select("+password");
    // Should still match original
    const stillMatchesOriginal = await user.comparePassword("OriginalPass@123");
    assert.ok(stillMatchesOriginal, "Password should not be rotated without explicit flag");
  });

  it("rotates password when --rotate-password flag is set", async () => {
    const email = "cli.staff.test@test.local";
    const batch = [
      {
        name: "CLI Staff Test",
        email,
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: [],
        password: "OriginalPass@123",
      },
    ];
    await provisionStaffBatch(batch);

    const batch2 = [{ ...batch[0], password: "NewPass@456!" }];
    await provisionStaffBatch(batch2, { rotatePassword: true });

    const user = await User.findOne({ email }).select("+password");
    const matchesNew = await user.comparePassword("NewPass@456!");
    assert.ok(matchesNew, "Password should be updated with rotatePassword flag");
  });

  it("provisions multiple staff with different roles and permissions", async () => {
    const batch = [
      {
        name: "Staff One",
        email: "cli.staff.test@test.local",
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: ["rental.read"],
        password: "SecurePass@123",
      },
      {
        name: "Staff Two",
        email: "cli.staff2.test@test.local",
        phone: "+91 9876543211",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: ["inventory.manage"],
        password: "SecurePass@456",
      },
    ];

    const summary = await provisionStaffBatch(batch);
    assert.equal(summary.created, 2);
    assert.equal(summary.total, 2);
  });

  it("prevents modifying admin accounts through staff provisioning", async () => {
    // Create an admin user directly
    const adminEmail = "admin.test@test.local";
    const admin = new User({
      name: "Admin User",
      email: adminEmail,
      phone: "+91 9876543210",
      password: "AdminPass@123",
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    await admin.save();

    // Attempt to provision through staff provisioning batch (skip validation since email is valid)
    const validatedBatch = [
      {
        name: "Renamed Admin",
        email: adminEmail,
        phone: "+91 9876543210",
        role: USER_ROLES.INTERNAL_STAFF,
        permissions: [],
        password: null,
      },
    ];

    await assert.rejects(
      () => provisionStaffBatch(validatedBatch),
      /administrator/i
    );

    await cleanupTestEmails(adminEmail);
  });
});

// ─────────────────────────────────────────────
// 3. ADMIN EMAIL WHITELIST — MIDDLEWARE
// ─────────────────────────────────────────────

describe("isAdminEmail — ADMIN_EMAILS whitelist", () => {
  before(() => {
    process.env.ADMIN_EMAILS = "admin@rental.com, ops.lead@rental.com, UPPER@rental.com";
  });

  it("returns true for an email in ADMIN_EMAILS", () => {
    assert.ok(isAdminEmail("admin@rental.com"));
  });

  it("returns true for a case-insensitive match", () => {
    assert.ok(isAdminEmail("ADMIN@RENTAL.COM"));
    assert.ok(isAdminEmail("upper@rental.com"));
  });

  it("returns false for an email not in ADMIN_EMAILS", () => {
    assert.equal(isAdminEmail("notadmin@rental.com"), false);
  });

  it("returns false for empty string", () => {
    assert.equal(isAdminEmail(""), false);
  });

  it("returns false for null/undefined", () => {
    assert.equal(isAdminEmail(null), false);
    assert.equal(isAdminEmail(undefined), false);
  });

  it("returns false when ADMIN_EMAILS is empty", () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "";
    assert.equal(isAdminEmail("admin@rental.com"), false);
    process.env.ADMIN_EMAILS = original;
  });
});

// ─────────────────────────────────────────────
// 4. REGRESSION — USER MODEL & PASSWORD HASHING
// ─────────────────────────────────────────────

describe("User model — password hashing regression", () => {
  after(async () => {
    await cleanupTestEmails("customer.test@test.local");
  });

  it("hashes password with bcrypt on save", async () => {
    const user = new User({
      name: "Customer Test",
      email: "customer.test@test.local",
      phone: "+91 9876543210",
      password: "CustomerPass@123",
      role: USER_ROLES.CUSTOMER,
    });
    await user.save();

    const saved = await User.findOne({ email: "customer.test@test.local" }).select("+password");
    assert.ok(saved, "User should be created");
    assert.notEqual(saved.password, "CustomerPass@123", "Password must not be plaintext");
    assert.ok(saved.password.startsWith("$2"), "Should be bcrypt hash");
  });

  it("comparePassword returns true for correct password", async () => {
    const user = await User.findOne({ email: "customer.test@test.local" }).select("+password");
    const match = await user.comparePassword("CustomerPass@123");
    assert.ok(match);
  });

  it("comparePassword returns false for wrong password", async () => {
    const user = await User.findOne({ email: "customer.test@test.local" }).select("+password");
    const match = await user.comparePassword("WrongPassword");
    assert.equal(match, false);
  });

  it("toSafeObject does not include password", () => {
    const user = new User({
      name: "Test",
      email: "x@test.local",
      phone: "+91 9876543210",
      password: "SomeHash",
      role: USER_ROLES.CUSTOMER,
    });
    const safe = user.toSafeObject();
    assert.equal(safe.password, undefined, "toSafeObject must not expose password");
  });

  it("does not double-hash password on re-save without modification", async () => {
    const user = await User.findOne({ email: "customer.test@test.local" }).select("+password");
    const hashBefore = user.password;
    // Modify non-password field only
    user.name = "Updated Name";
    await user.save();
    const hashAfter = (await User.findOne({ email: "customer.test@test.local" }).select("+password")).password;
    assert.equal(hashBefore, hashAfter, "Hash must not change when password was not modified");
  });
});

// ─────────────────────────────────────────────
// 5. ALLOWED ROLES & PERMISSIONS REGISTRY
// ─────────────────────────────────────────────

describe("Role and permission allowlists", () => {
  it("ALLOWED_STAFF_ROLES contains internal_staff", () => {
    assert.ok(ALLOWED_STAFF_ROLES.includes("internal_staff"));
  });

  it("ALLOWED_STAFF_ROLES does not contain admin", () => {
    assert.equal(ALLOWED_STAFF_ROLES.includes("admin"), false);
  });

  it("ALLOWED_STAFF_ROLES does not contain customer", () => {
    assert.equal(ALLOWED_STAFF_ROLES.includes("customer"), false);
  });

  it("ALLOWED_PERMISSIONS contains expected permissions", () => {
    const required = ["rental.read", "inventory.manage", "support.read", "orders.read"];
    for (const perm of required) {
      assert.ok(ALLOWED_PERMISSIONS.includes(perm), `Missing permission: ${perm}`);
    }
  });
});
