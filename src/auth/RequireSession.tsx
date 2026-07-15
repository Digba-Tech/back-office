import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"

// Guards a route on "is anyone logged in". Whether that person is an admin
// is decided server-side per request (guide §2) — this never tries to
// duplicate that check client-side.
export function RequireSession() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
