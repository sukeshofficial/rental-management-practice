# Implementation Plan: F01 Internal Staff and Admin Provisioning

## 1. Overview & Context
This plan addresses feature **F01 Authentication & Access Control — Internal Staff and Admin Provisioning** for the Rental Management application backend.
The goal is to provide a production-ready, highly secure, repeatable, and idempotent staff provisioning system accessible via:
1. Terminal CLI (`npm run create:staff -- ...`)
2. Protected Administrator API (`POST /api/v1/admin/staff` and alias `/api/admin/staff`)

We will strictly follow the principle of least privilege, preventing privilege escalation, arbitrary admin creation, credential leakage, and silent overwrites.

---

## 2. Current Architecture & Inspection Findings

1. **User Model (`server/src/models/user.model.js`)**:
   - `USER_ROLES` currently includes: `CUSTOMER: "customer"`, `END_USER: "end_user"`, `INTERNAL_STAFF: "internal_staff"`.
   - `ADMIN` role is currently missing from `USER_ROLES`. To support administrative access without breaking existing roles, we will add `ADMIN: "admin"` to `USER_ROLES`.
   - The user schema enforces `password` minlength 8, hides password by default (`select: false`), and implements a `pre("save")` hook hashing with `bcrypt.genSalt(12)` when modified.
   - `permissions` array does not currently exist on the user document. We will add an optional `permissions: [{ type: String, trim: true }]` field to `userSchema` with an explicit permissions registry.

2. **Auth Service & Middleware (`server/src/services/auth.service.js`, `server/src/middleware/auth.middleware.js`)**:
   - `generateToken(user)` puts `id`, `email`, and `role` in the JWT payload.
   - `authenticate` verifies JWT from cookies or `Authorization: Bearer <token>`, fetches user, checks for `status !== DISABLED`, and attaches to `req.user`.
   - `requireRole(...allowedRoles)` restricts endpoint access to specified roles.
   - `requirePermission(permission)` checks `rolePermissions` dictionary.

3. **Existing Script (`server/scripts/create-staff.js`)**:
   - Imports `User`, `connectDB`, and `generateToken`.
   - Has hardcoded fallback credentials and prints them in array format; generates a token for every staff member (unnecessary for provisioning).
   - CLI arguments `[email, password, name, phone]` only handle a single account and take password as a command line argument (vulnerable to process table `ps`/history inspection).
   - Does not validate schemas or preflight checks across batches.

4. **Package & Scripts (`server/package.json`)**:
   - Has `"seed:staff": "node scripts/create-staff.js"`.
   - Needs `"create:staff": "node scripts/create-staff.js"` and a test script `"test": "node --test tests/**/*.test.js"`.
   - ESLint config is currently missing an `eslint.config.js` causing `npm run lint` to fail; we will provide a clean `eslint.config.js` or fix it.

---

## 3. Security & Privilege Boundaries

1. **Role Model**:
   - `customer`: Public registration default. Forbidden from creating staff or admin.
   - `end_user`: Limited access. Default denial for provisioning.
   - `internal_staff`: Operational staff with specific granted permissions (e.g., `rental.read`, `inventory.manage`). Cannot create staff or admin accounts.
   - `admin`: Authorized to provision staff accounts. May NOT provision other `admin` accounts via staff provisioning endpoints unless explicitly permitted through root bootstrap.

2. **Permission Allowlist**:
   - Supported staff permissions:
     - `rental.read`, `rental.operations`
     - `inventory.read`, `inventory.manage`
     - `support.read`, `support.manage`
     - `orders.read`, `orders.manage`
   - Any unlisted permission is rejected during preflight validation.

3. **Bootstrap Admin Configuration**:
   - Supported via environment variables:
     - `INITIAL_ADMIN_EMAIL` (e.g. `admin@rental.example`)
     - `INITIAL_ADMIN_PASSWORD` (or prompted interactively via bootstrap command)
   - CLI bootstrap command: `npm run bootstrap:admin` or flag `--bootstrap-admin` in `create-staff.js`.
   - Safe idempotency: if an admin already exists or email is taken with a different role, fail safely and alert without overwriting.

---

## 4. Shared Provisioning Service Architecture

Create `server/src/services/staffProvisioning.service.js`:
1. **Preflight Validation**:
   - Accepts an array of staff definitions.
   - Validates each item: valid email format, valid phone format, name, valid role (`internal_staff`), valid permissions list from allowlist.
   - Detects duplicate emails within the input.
   - Checks that all required password sources exist (password value or env var).
   - If ANY record is invalid, throws a validation error before making any database queries or mutations.
2. **Idempotent Upsert Logic**:
   - Default behavior:
     - If user does not exist: create user with role `internal_staff`, active status, hashed password, permissions.
     - If user exists: preserve existing password, preserve role, preserve permissions unless explicit flags are set (`updateProfile`, `rotatePassword`, `syncPermissions`, `changeRole`, `reactivate`).
     - Report outcome per record: `created`, `updated`, or `unchanged`.
3. **No Credential Leaks**:
   - Passwords and tokens are never returned in results or printed to stdout.
   - Sanitize all log output against control characters and log injection.

---

## 5. Terminal CLI (`server/scripts/create-staff.js`)

Support flags:
- `--file <path>`: Load staff from JSON file.
- Single account interactive mode (when run without `--file`, prompt securely for email, name, phone, and hidden password using `readline` or silent prompt).
- Options for safe update: `--update-profile`, `--rotate-password`, `--sync-permissions`, `--change-role`, `--reactivate`.
- Password resolution: Resolves `passwordEnv` by looking up `process.env[item.passwordEnv]`. Rejects if missing.
- Exit code: 0 on success, 1 on validation or execution failure. Closes MongoDB connection cleanly in `finally` block.

---

## 6. Admin API (`POST /api/v1/admin/staff` and `/api/admin/staff`)

1. **Routes**:
   - Mount `server/src/routes/adminStaff.routes.js` at `/api/v1/admin/staff` and `/api/admin/staff`.
2. **Middleware Pipeline**:
   - `authenticate`: Checks JWT, verifies account is not disabled.
   - `requireRole(USER_ROLES.ADMIN)`: Verifies role is `admin`.
   - Request body validation: Validates `{ staff: [...] }`.
   - Calls `staffProvisioning.service.js`.
   - Returns 200/201 with summary list of created/updated staff (sanitized, safe object without password or secrets).
3. **Privilege Escalation Protection**:
   - Callers cannot pass `role: "admin"` to create admin accounts via this endpoint (only `internal_staff` can be provisioned).
   - Ordinary staff calling this endpoint get `403 Forbidden`. Customers get `403 Forbidden`. Unauthenticated requests get `401 Unauthorized`.

---

## 7. Automated Testing Plan

Create tests in `server/tests/`:
1. `server/tests/staffProvisioning.test.js`:
   - Unit tests for validation (unknown role rejection, unknown permission rejection, duplicate emails rejection, missing password env rejection).
   - Idempotency tests (rerun creates no duplicates, passwords preserved unless rotated).
2. `server/tests/adminStaffApi.test.js`:
   - 401 unauthenticated.
   - 403 customer, end user, and ordinary internal staff.
   - 200/201 authorized admin provisioning.
   - Attempted privilege escalation (`role: admin`) rejected.
   - Passwords absent from API responses.
3. `server/tests/authRegression.test.js`:
   - Public customer registration still works and assigns `customer`.
   - Existing customer login, profile fetch, logout work.
   - Disabled account rejection works.

---

## 8. Step-by-Step Implementation Steps
1. Update `user.model.js` to add `ADMIN: "admin"` to `USER_ROLES` and `permissions` array field.
2. Create `staffProvisioning.service.js` with comprehensive preflight checks and idempotent upsert logic.
3. Update `create-staff.js` with JSON file support, env password resolution, safe CLI flags, interactive prompt fallback, and clean DB disconnect.
4. Add admin staff controller `adminStaff.controller.js` and routes `adminStaff.routes.js`.
5. Register routes in `app.js`.
6. Provide `scripts/staff.template.example.json` and update `.gitignore` to ignore real secret files like `staff.local.json`.
7. Configure `package.json` scripts (`create:staff`, `bootstrap:admin`, `test`).
8. Add ESLint configuration (`eslint.config.js`) so `npm run lint` passes.
9. Implement automated test suites using Node test runner (`node --test`).
10. Run tests, lint, and write verification documentation in `server/docs/F01-staff-provisioning-verification.md`.
