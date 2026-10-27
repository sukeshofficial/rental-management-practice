import * as React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/context/AuthContext"

import LogoutButton from "@/components/auth/LogoutButton"

function DashboardPage() {
    const { user } = useAuth()
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Welcome to your rental workspace, <span className="font-semibold text-foreground">{user?.name || user?.email || "Customer"}</span>.
                </p>
                <div className="pt-4 border-t border-border/80 flex justify-center">
                    <LogoutButton />
                </div>
            </div>
        </div>
    )
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            {/* Redirect unauthenticated requests to /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}
