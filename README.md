# Rental Management - Modern Property Workspace

A production-ready full-stack property management application built with a modern, high-contrast, accessible UI and secure authentication primitives.

---

## 📸 Overview & Features

### 1. Authentication & Security
- **Split-Screen Layout**: Implements an edge-to-edge residential architectural branding panel on the left with high-fidelity day/night photography matching the active theme, paired with a clean, focused form panel on the right.
- **Login (`/login`)**:
  - Email format validation with icons (`Mail`, `Lock`).
  - Accessible password visibility toggle (`Eye`, `EyeOff`).
  - Integrated "Forgot username / password?" recovery workflow.
  - Link to registration.
- **Registration (`/register` & `/signup`)**:
  - 5-field registration flow: *Your Email*, *Your Name*, *Your Phone*, *Password*, and *Confirm Password*.
  - Functional 3-segment password strength meter (*Weak*, *Medium*, *Strong*) evaluating character variety, length, and digits.
  - Real-time password confirmation validation.
- **Password Reset (`/reset-password?token=...&email=...`)**:
  - Deep link handler dispatched via outbound emails.
  - Automatic token validity verification on mount.
  - Dynamic states for token validation, expiration warnings, password submission, and instant login transition.
- **Outbound Email Service (`nodemailer`)**:
  - Transactional HTML email template styled with table-based markup for cross-client compatibility (Gmail, Apple Mail, Outlook VML buttons).
  - High-security password reset tokens hashed with SHA-256 and verified against a 1-hour expiration timestamp.
  - Development browser preview available at `GET /api/v1/auth/preview/password-reset`.
- **Protected Routes & Session Persistence**:
  - React Context `<AuthProvider>` verifying credentials and active user profile via `/api/v1/auth/me`.
  - `<ProtectedRoute>` guarding restricted surfaces like `/dashboard` and redirecting unauthenticated users to `/login`.
  - Dedicated `<LogoutButton>` handling server-side session invalidation and clearing client tokens.
- **Light & Dark Theme Engine**:
  - Full theme engine with `ThemeProvider` and `ModeToggle`.
  - Accessible contrast in both modes (OKLCH color tokens, deep navy/charcoal dark mode, warm off-white light mode).
  - Custom subtle scrollbars customized for both light and dark themes.

---

## 🛠 Tech Stack

### Frontend (`client/`)
- **Core**: React 19, Vite 8, React Router v7
- **State Management**: Redux Toolkit & React Context (`AuthContext`)
- **Styling**: Tailwind CSS v4, Base UI, Radix Primitives, Geist Sans & Geist Mono fonts
- **Icons**: Lucide React
- **Linter**: Oxlint

### Backend (`server/`)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database & ODM**: MongoDB with Mongoose 9
- **Security**: Helmet, CORS, Cookie-Parser, Express-Rate-Limit, Bcrypt.js, JsonWebToken
- **Email**: Nodemailer (configurable SMTP / service presets with development preview logger)

---

## 📁 Repository Structure

```text
rental-management/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── api/                # Axios API instance and interceptors
│   │   ├── assets/             # Architectural photography and branding assets
│   │   ├── components/
│   │   │   ├── auth/           # AuthLayout, AuthInput, AuthBrandPanel, LogoutButton, PasswordStrength
│   │   │   ├── theme/          # ThemeProvider and ModeToggle
│   │   │   └── ui/             # Reusable UI primitives (buttons, dialogs, inputs)
│   │   ├── context/            # AuthContext (user, token, session management)
│   │   ├── pages/              # LoginPage, SignupPage, ResetPasswordPage
│   │   ├── routes/             # AppRoutes and ProtectedRoute wrapper
│   │   ├── services/           # authService (login, register, resetPassword, logout)
│   │   └── index.css           # Design tokens, custom scrollbars, typography
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # Database connection (MongoDB)
│   │   ├── controllers/        # auth.controller.js
│   │   ├── middleware/         # auth.middleware.js (token verification, role checks)
│   │   ├── models/             # user.model.js (User schema, bcrypt hashing, tokens)
│   │   ├── routes/             # auth.routes.js, health.routes.js
│   │   ├── services/           # auth.service.js, email.service.js
│   │   └── app.js              # Express application setup
│   └── package.json
│
├── docs/                       # Specifications, references, and plans
├── package.json                # Root package with concurrently runner
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Installation

Install dependencies across root, server, and client:

```bash
# In repository root
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 2. Environment Configuration

#### Backend Configuration (`server/.env`)
Create a `.env` file in `server/` based on [server/.env.example](file:///e:/SUKESH-PRODUCTS/rental-management/server/.env.example):

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/odoo
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email / SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password_or_app_key
SMTP_SECURE=false
EMAIL_FROM="Rental Management" <noreply@rentalmanagement.com>

# Optional service preset: gmail, sendgrid, ses (overrides SMTP_HOST/SMTP_PORT)
# EMAIL_SERVICE=gmail
```

> **Note on Email in Development**: If no SMTP credentials are provided, outbound emails will automatically log formatted previews directly to the server terminal and can be visually previewed in the browser at `http://localhost:5000/api/v1/auth/preview/password-reset`.

#### Frontend Configuration (`client/.env`)
Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Running the Application

Start both client and server concurrently from the root directory:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:5000`

---

## 🔐 API Reference

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register new customer account | Public |
| `POST` | `/login` | Authenticate with email and password | Public |
| `POST` | `/logout` | Invalidate session and clear auth cookie | Authenticated |
| `POST` | `/forgot-password` | Request password reset email | Public (Rate-limited) |
| `GET` | `/verify-reset-token`| Validate password reset token | Public |
| `POST` | `/reset-password` | Reset password using verified token | Public |
| `GET` | `/me` | Get current authenticated user profile | Authenticated |
| `PATCH`| `/me` | Update personal profile (name, phone) | Authenticated |

---

## 🧪 Quality & Verification Checks

```bash
# Build frontend production bundle
cd client && npm run build

# Run frontend linter
cd client && npm run lint
```

---

## 📄 License

This project is proprietary and built for Rental Management. All rights reserved.

---

<p align="center">
  <img src="https://sonarcloud.io/images/project_badges/sonarcloud-dark.svg" alt="SonarQube Cloud" />
  <a href="https://sonarcloud.io/api/project_badges/quality_gate?project=sukeshofficial_rental-management2">
  </a>

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=sukeshofficial_rental-management2)](https://sonarcloud.io/summary/new_code?id=sukeshofficial_rental-management2)

</p>
