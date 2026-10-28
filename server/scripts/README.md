# Staff Provisioning — CLI & API Guide

## Overview

Staff provisioning creates and manages `internal_staff` accounts.

**Administrator identity** is controlled entirely through the `ADMIN_EMAILS` environment variable — no database role is required. Any user who logs in with an email listed in `ADMIN_EMAILS` gets admin access automatically.

---

## 1. Configure Admin Emails

Edit `server/.env`:

```env
# Comma-separated list of admin emails
ADMIN_EMAILS=yourname@gmail.com,another.admin@gmail.com
```

Any user who registers or logs in with one of these emails will have full admin access (staff provisioning, etc.). This is purely server-controlled — callers cannot claim admin status.

---

## 2. Provision Staff via CLI

### Step 1 — Set password secrets in `.env`

```env
OPERATIONS_STAFF_PASSWORD=SecurePass@2026!
INVENTORY_MANAGER_PASSWORD=AnotherSecure@2026!
```

### Step 2 — Copy and edit the template

```bash
cp server/scripts/staff.template.example.json server/scripts/staff.local.json
# Edit staff.local.json with real emails and passwordEnv references
```

> ⚠️ `staff.local.json` is in `.gitignore` — never commit files with real staff definitions.

### Step 3 — Run the provisioning command

```bash
cd server
npm run create:staff -- --file ./scripts/staff.local.json
```

### Optional flags

| Flag | Effect |
|------|--------|
| `--update-profile` | Update name and phone for existing accounts |
| `--rotate-password` | Rotate password for existing accounts |
| `--sync-permissions` | Sync permissions for existing accounts |
| `--change-role` | Change role for existing accounts |
| `--reactivate` | Reactivate disabled accounts |

### Example — rotate passwords on a rerun

```bash
npm run create:staff -- --file ./scripts/staff.local.json --rotate-password
```

---

## 3. Allowed Permissions

```
rental.read         rental.operations
inventory.read      inventory.manage
support.read        support.manage
orders.read         orders.manage
view:all_orders     manage:internal_dashboard    manage:staff_ops
```

---

## 4. Provision Staff via Admin API

### Endpoint

```
POST /api/v1/admin/staff
```

### Authentication

Log in first with an email listed in `ADMIN_EMAILS`:

```bash
POST /api/v1/auth/login
{ "email": "yourname@gmail.com", "password": "..." }
```

The JWT cookie is set automatically. Then call:

```bash
POST /api/v1/admin/staff
Content-Type: application/json
Cookie: token=<your-jwt>

{
  "staff": [
    {
      "name": "Operations Staff",
      "email": "ops@rental.example",
      "phone": "+91 9876543210",
      "role": "internal_staff",
      "permissions": ["rental.read", "rental.operations"],
      "password": "SecurePass@2026!"
    }
  ],
  "updateProfile": false,
  "rotatePassword": false,
  "syncPermissions": false
}
```

> **Note**: The API does not resolve `passwordEnv` — passwords must be provided inline in the request body for API provisioning. Keep API calls over HTTPS in production.

### Responses

| Caller | Response |
|--------|----------|
| Not logged in | `401 Unauthorized` |
| Logged in but not in ADMIN_EMAILS | `403 Forbidden` |
| Admin (in ADMIN_EMAILS) | `200 OK` with provisioning summary |

---

## 5. Security Rules

- **Admin emails are set on the server only** — in `.env`. Callers cannot self-promote.
- **Passwords are never logged** or returned in responses.
- **Existing passwords are preserved** on rerun unless `--rotate-password` is used.
- **Existing admin accounts cannot be modified** by this script or API.
- **All records are validated before any DB write** — partial provisioning cannot occur on validation failure.

---

## 6. Recovery from Failed Provisioning

If provisioning fails partway through (unlikely since validation is atomic), re-run the same command. The script is idempotent — existing accounts are not duplicated or overwritten without explicit flags.

---

## 7. Production Deployment

1. Set `ADMIN_EMAILS`, `MONGODB_URI`, and staff password env vars on the production server.
2. SSH into the server or use your deployment pipeline.
3. Run `npm run create:staff -- --file ./scripts/staff.local.json`.
4. Never commit `staff.local.json` or `.env` files.
