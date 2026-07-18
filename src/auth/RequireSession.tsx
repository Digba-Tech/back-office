import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import { SetPassword } from "@/pages/SetPassword"

// Guards a route on "is anyone logged in". Whether that person is an admin
// is decided server-side per request (guide §2) — this never tries to
// duplicate that check client-side. It does block on the client-only
// must_change_password flag (guide §2), which the backend never checks.
export function RequireSession() {
  const { session, loading, mustChangePassword } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (mustChangePassword) {
    return <SetPassword />
  }

  return <Outlet />
}
