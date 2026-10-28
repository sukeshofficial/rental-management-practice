# Rental Management — RBAC API Contract

**Version:** 1.0  
**Purpose:** Frontend integration contract for Role-Based Access Control (RBAC), authentication state, and administrator-managed staff provisioning.

> **Source of truth:** The supplied staff-provisioning routes, controller, service, and eight Postman test cases. Authentication endpoint paths and response formats not shown in those sources are marked as requiring confirmation.

## 1. Base URL and conventions

- Development base URL example: `http://localhost:5000`
- API prefix: `/api/v1`
- Request content type: `application/json`
- Staff provisioning endpoint: `POST /api/v1/admin/staff`
- Compatibility alias: `POST /api/admin/staff`

Configure the base URL through frontend environment configuration rather than hardcoding it in components.

## 2. Roles

The role values confirmed by the supplied implementation are:

| Role | Meaning |
|---|---|
| `admin` | Administrator |
| `internal_staff` | Internal staff |

Only `internal_staff` is allowed when provisioning staff through this API. Requests to create staff with role `admin` are rejected. The provisioning service also refuses to alter an existing administrator account.

## 3. Allowed staff permissions

The backend accepts these permission strings:

- `rental.read`
- `rental.operations`
- `inventory.read`
- `inventory.manage`
- `support.read`
- `support.manage`
- `orders.read`
- `orders.manage`
- `view:all_orders`
- `manage:internal_dashboard`
- `manage:staff_ops`

A permission outside this list is rejected. The supplied administrator-bootstrap service assigns `["*"]` to the initial administrator. Do not infer that `["*"]` is accepted as an ordinary staff permission; staff provisioning validates permissions against the allow-list above.

## 4. Authentication and authorization

The staff-provisioning route applies the following middleware:

1. Rate limiter: maximum 30 requests per 15 minutes.
2. `authenticate`: verifies authentication and active account status according to the backend middleware.
3. `requireRole(USER_ROLES.ADMIN)`: restricts access to administrators.
4. `provisionStaff`: validates and processes the request.

If the backend uses bearer JWT authentication, send:

```http
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

The supplied unauthenticated test returns:

```json
{
  "success": false,
  "message": "Authentication required. Please log in."
}
```

The exact token transport, expiry, refresh behavior, and cookie settings must be confirmed from the authentication middleware and auth routes; they are not established by the staff-provisioning files alone.

## 5. Staff provisioning endpoint

### `POST /api/v1/admin/staff`

**Access:** Authenticated active administrator only.

Compatibility alias: `POST /api/admin/staff`. Both paths use the same router and authorization middleware.

### Request body

```json
{
  "staff": [
    {
      "name": "Postman Test Staff",
      "email": "staff@example.com",
      "phone": "+91 82200 38446",
      "role": "internal_staff",
      "permissions": ["rental.read", "inventory.read"],
      "password": "TestStaff@12345"
    }
  ]
}
```

### Field requirements

| Field | Type | Requirement |
|---|---|---|
| `staff` | Array | Required; must be non-empty |
| `staff[].name` | String | Required; non-empty after trimming |
| `staff[].email` | String | Required; valid email; normalized to lowercase |
| `staff[].phone` | String | Required; must match backend phone validation |
| `staff[].role` | String | Optional; defaults to `internal_staff`; no other staff role is permitted |
| `staff[].permissions` | String array | Optional; defaults to `[]`; each value must be allow-listed |
| `staff[].password` | String | Required for a new account; minimum 8 characters when provided |
| `staff[].passwordEnv` | String | Accepted by the shared service/CLI validator, but environment-variable resolution is disabled for API requests |

Unknown fields are rejected. For example, `isAdmin` is not accepted.

Emails are checked for duplicates within the submitted batch without regard to case. The entire batch is validated before provisioning writes begin.

### Optional batch flags

All flags default to `false`:

| Flag | Behavior for an existing staff account |
|---|---|
| `updateProfile` | Updates name and phone when they differ |
| `rotatePassword` | Replaces the password when one is supplied |
| `syncPermissions` | Replaces current permissions with the supplied list |
| `changeRole` | Attempts to update the role; the role must still pass staff-role validation |
| `reactivate` | Reactivates an account whose status is `disabled` |

Enable these flags only for an explicitly intended administrator action. Existing account role, permissions, status, and password are preserved unless the corresponding option is enabled. Existing administrator accounts cannot be modified by this service.

### Successful response

HTTP `200 OK`:

```json
{
  "success": true,
  "message": "Staff provisioning complete: 1 created, 0 updated, 0 unchanged.",
  "data": {
    "total": 1,
    "created": 1,
    "updated": 0,
    "unchanged": 0,
    "results": [
      {
        "email": "staff@example.com",
        "name": "Postman Test Staff",
        "role": "internal_staff",
        "permissions": ["rental.read", "inventory.read"],
        "status": "active",
        "action": "created"
      }
    ]
  }
}
```

`data.results[].action` can be `created`, `updated`, or `unchanged`.

### Error responses verified by supplied test cases

| Scenario | Expected HTTP status | Example message |
|---|---:|---|
| Missing `staff` array | `400` | `Missing 'staff' array in request body` |
| Unsupported role | `400` | `Staff record #1 requested unsupported or unauthorized staff role 'admin'. Only 'internal_staff' is permitted.` |
| Unknown field | `400` | `Staff record #1 contains unrecognized fields: isAdmin` |
| Duplicate email in batch | `400` | `Staff record #2 has duplicate email in batch: duplicate@example.com` |
| Invalid permission | `400` | Message identifies the invalid permission and allowed permissions |
| Missing password for a new account | `400` | Message states that no password or password secret was provided |
| Existing administrator in provisioning batch | `403` | Message states that staff provisioning cannot alter administrator accounts |
| Unauthenticated request | Usually `401` or `403` | `Authentication required. Please log in.` |
| Rate limit exceeded | `429` | `Too many admin requests. Please try again after 15 minutes.` |

The controller uses `error.statusCode` when supplied and otherwise returns `500`.

## 6. Frontend normalized authentication model

The frontend can normalize backend user responses into this internal shape. This is a **frontend contract proposal**, not a claim that current authentication endpoints already return this exact JSON.

```ts
export type UserRole = "admin" | "internal_staff";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  status: "active" | "disabled";
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}
```

Map the actual backend identifier field (for example, `_id` or `id`) to `AuthUser.id`. Never include the password in `AuthUser`.

## 7. AuthContext interface

Expose a shared authentication context so components do not make duplicate identity requests or implement role checks independently.

```ts
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  permissions: string[];

  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}
```

### AuthContext behavior

1. Start with `isLoading: true` while the current session is checked.
2. Restore or validate the session using the real backend authentication mechanism.
3. Fetch or normalize the authenticated user using the actual current-user endpoint, if one exists.
4. Set `user` only after the backend confirms identity and status.
5. Derive `isAuthenticated` from validated authentication state, not merely from the existence of a token string.
6. Set `isAdmin` when the validated user's role is `admin`.
7. Derive `permissions` from the validated user response.
8. On logout or an invalid session, clear user state and private cached data.
9. Avoid rendering protected pages before initial session resolution completes.
10. Do not store passwords in context, local storage, or session storage.

The actual login, registration, current-user, logout, and refresh endpoint paths and payloads must be taken from the existing auth routes/controller/service. They were not included in the staff-provisioning sources.

## 8. Route and component guards

Recommended responsibilities:

- `ProtectedRoute`: requires a validated authenticated session.
- `RoleGuard`: displays content only when the current user has an allowed role.
- `PermissionGuard`: displays content only when the current user has a required permission.
- `useAuth()`: exposes the shared context to pages and components.

Example:

```tsx
if (isLoading) return <LoadingScreen />;
if (!isAuthenticated) return <Navigate to="/login" replace />;
```

Permission check:

```tsx
const canManageInventory = hasPermission("inventory.manage");
```

Frontend guards improve navigation and user experience only. Backend middleware must independently enforce authorization for every protected API.

## 9. Suggested frontend API modules

```text
src/
├── api/
│   ├── apiClient.ts
│   ├── auth.api.ts
│   └── adminStaff.api.ts
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx
│       ├── RoleGuard.tsx
│       └── PermissionGuard.tsx
└── types/
    ├── auth.types.ts
    └── rbac.types.ts
```

`adminStaff.api.ts` should call `POST /api/v1/admin/staff` and return the typed provisioning summary. The API client should attach credentials using the backend's real mechanism and normalize errors without exposing secrets.

## 10. Security requirements

- The backend is the source of truth for roles, permissions, and account status.
- Never trust a role or permissions array supplied by the browser.
- Never allow public registration to grant an administrator role.
- Never expose passwords or authentication secrets in logs or UI state.
- Handle `401` as an authentication/session failure and `403` as an authorization failure, while respecting the backend's actual middleware semantics.
- Use secure `HttpOnly` cookies when supported by the backend session design; otherwise follow the implemented token lifecycle.
- Do not invent a refresh-token flow or current-user endpoint if the backend does not provide one.
- Keep frontend route guards and backend authorization in sync.

## 11. Acceptance criteria

- [ ] Authentication state is shared through `AuthContext`.
- [ ] Session initialization completes before protected content renders.
- [ ] The authenticated user's role and permissions are normalized from backend data.
- [ ] Staff cannot access administrator-only UI or APIs.
- [ ] Permission-based UI checks use shared helpers.
- [ ] Staff provisioning uses the verified endpoint and request schema.
- [ ] Provisioning success and validation failures are handled correctly.
- [ ] Logout clears frontend authentication state and uses backend logout if supported.
- [ ] Existing authentication endpoints, response schemas, and token/cookie behavior are verified before integration.

## 12. Backend files needed to finalize authentication routes

To make the authentication section exact, verify:

- `auth.routes.js`
- `auth.controller.js`
- `auth.service.js`
- `auth.middleware.js`
- `user.model.js`

The supplied staff-provisioning files establish the staff API and authorization requirements, but do not establish the complete login/session API contract.
