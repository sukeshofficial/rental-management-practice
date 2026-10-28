// client/src/routes/index.jsx
import * as React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

// Admin Interfaces
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage"
import ProductsOverviewPage from "@/pages/admin/ProductsOverviewPage"
import ProductDetailPage from "@/pages/admin/ProductDetailPage"
import CreateProductPage from "@/pages/admin/CreateProductPage"
import RentalOrdersPage from "@/pages/admin/RentalOrdersPage"

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin Management Interfaces */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/product"
                element={
                    <ProtectedRoute>
                        <ProductsOverviewPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/product/create"
                element={
                    <ProtectedRoute>
                        <CreateProductPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/product/:productId"
                element={
                    <ProtectedRoute>
                        <ProductDetailPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/rental"
                element={
                    <ProtectedRoute>
                        <RentalOrdersPage />
                    </ProtectedRoute>
                }
            />

            {/* Default root path redirects to /dashboard */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}
