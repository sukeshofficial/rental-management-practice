# F01: Authentication and Access Control - Implementation Plan

## 1. Current Architecture and Conventions
- **Backend Architecture**: Node.js ES Modules (`"type": "module"`) running Express 5 (`express@^5.3.0`), Mongoose 9 (`mongoose@^9.11.2`), Helmet, CORS, Morgan. Serverless-ready structure with `server/api/index.js` exporting Express `app` for Vercel deployment, and `server/src/index.js` for standalone development.
- **Backend Conventions**:
  - Controller-service pattern (`src/controllers`, `src/services`, `src/models`, `src/routes`, `src/config`).
  - Route mounting in `app.js` under `/api/v1/...` (e.g., `/api/v1/health`, `/api/v1/test-input`). To adhere to prompt contracts, we will mount `/api/v1/auth` and alias `/api/auth` or provide direct routes matching both `/api/auth` and `/api/v1/auth`.
  - JSON responses follow standard envelope `{ success: true/false, message: "...", data?: ... }` or contract representation `{ user: ... }`.
- **Frontend Architecture**: React 19 (`react@^19.2.8`), Vite 8, Redux Toolkit (`@reduxjs/toolkit@^2.13.0`), React Router v7 (`react-router-dom@^7.18.4`), Tailwind CSS v4, Lucide React icons, and Base-UI / Shadcn UI components.
- **Frontend Conventions**:
  - Global store configured in `src/redux/Store.js`.
  - Feature slices in `src/redux/Slices/` using `createSlice` and `createAsyncThunk`.
  - Base UI components in `src/components/ui/` (`button.jsx`, `input.jsx`, `tooltip.jsx`).
  - Styling tokens defined in `src/index.css` with dark/light mode support using OKLCH colors.

## 2. Existing Authentication-Related Code & Gaps
- **Existing Auth Code**: None. There were no user models, authentication routes, sessions, or role guards.
- **Identified Gaps**:
  - No `User` schema or persistence model.
  - No password hashing library or token management configured.
  - No auth middleware to authenticate or check roles (`requireAuth`, `requireRole`, `requirePermission`).
  - No customer ownership authorization helper for protecting user-specific data.
  - No frontend login or registration pages, route protection, or auth state slice.
  - No test framework configured in `server` to verify authentication and access control.

## 3. Security Decisions & Strategy
1. **Authentication Strategy**:
   - Industry-standard dual-token/bearer + HTTP-only cookie support. JWT stored in `httpOnly`, `sameSite: "lax"`, `secure: (NODE_ENV === "production")` cookie named `token`, with fallback to `Authorization: Bearer <token>` header for flexible API testing and client compatibility.
   - Credentials validated via `bcryptjs` with salt round 12.
2. **Role & Account State Control**:
   - Roles strictly enumerated: `customer`, `end_user`, `internal_staff`.
   - Default role upon public registration is always `customer`. Any client-supplied `role`, `status`, `permissions`, or `isAdmin` fields are strictly ignored/stripped.
   - User account status: `active`, `disabled`. Disabled accounts are blocked at login and on every authenticated request.
3. **Password Security**:
   - Enforce minimum 8 characters with upper, lower, number, and special character check server-side.
   - Password strength evaluator on the frontend (Weak, Medium, Strong).
   - Password confirmation matched on both client and server before processing.
   - Passwords never persisted in plaintext, never returned in API responses (`select: "-password"`).
4. **Ownership Authorization Primitive**:
   - Reusable `authorizeOwnership(resourceOwnerId, reqUser)` utility service verifying that a `customer` can only query or mutate resources where `resource.customerId.toString() === reqUser._id.toString()`.
5. **Rate Limiting & Generic Errors**:
   - `express-rate-limit` applied to `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`.
   - Generic login errors: "Invalid email or password" to prevent account enumeration.

## 4. Files to Create or Modify

### Backend (`server/`)
- `package.json`: Add dependencies (`bcryptjs`, `jsonwebtoken`, `cookie-parser`, `express-rate-limit`). Add `test` script running a native node test runner or isolated test suite.
- `.env.example`: Document `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_DOMAIN`, etc.
- `src/models/user.model.js`: Define User schema with email index, lowercase normalization, phone, role, status, password hash.
- `src/services/auth.service.js`: Registration, login, profile updates, password recovery stub, user serialization.
- `src/services/ownership.service.js`: Reusable customer ownership authorization primitive.
- `src/middleware/auth.middleware.js`: `authenticate`, `requireRole`, `requirePermission`.
- `src/controllers/auth.controller.js`: Handlers for register, login, logout, getMe, updateMe, forgotPassword, resetPassword.
- `src/routes/auth.routes.js`: Public and protected endpoints.
- `src/app.js`: Wire `cookie-parser`, mount `/api/auth` and `/api/v1/auth`.
- `tests/auth.test.js`: Comprehensive automated test suite verifying AC-01 through AC-10.

### Frontend (`client/`)
- `src/redux/Slices/authSlice.js`: Redux slice for user, auth state, login, register, logout, fetchMe.
- `src/redux/Store.js`: Register `auth` reducer.
- `src/lib/api.js`: Axios instance configured with `withCredentials: true` and interceptors.
- `src/components/auth/Login.jsx`: Login view with Rental Management branding, inline validation, password toggle, keyboard accessibility.
- `src/components/auth/Register.jsx`: Register view with password strength indicator, phone validation, confirm password.
- `src/components/auth/ProtectedRoute.jsx`: Role-aware protected route wrapper.
- `src/components/auth/Unauthorized.jsx`: Access denied / forbidden page.
- `src/components/dashboard/CustomerDashboard.jsx`: Customer landing page with profile display and ownership check tester.
- `src/components/dashboard/StaffDashboard.jsx`: Internal staff management landing page.
- `src/App.jsx`: Update routes with public, customer-protected, and staff-protected paths.

## 5. Implementation Order
- **Stage 1**: Inspection and Implementation Plan (Complete).
- **Stage 2**: Authentication Data Model (`user.model.js`).
- **Stage 3**: Backend Authentication (`auth.service.js`, `auth.controller.js`, `auth.routes.js`).
- **Stage 4**: Authorization Middleware & Ownership Primitive (`auth.middleware.js`, `ownership.service.js`).
- **Stage 5**: Frontend Authentication UI (`Login.jsx`, `Register.jsx`, Redux slice).
- **Stage 6**: Frontend Route Protection (`ProtectedRoute.jsx`, `CustomerDashboard.jsx`, `StaffDashboard.jsx`).
- **Stage 7**: Automated Tests, Security, Build, and Lint Checks.
- **Stage 8**: Verification Document (`docs/F01-authentication-verification.md`).
