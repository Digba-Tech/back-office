import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"

// Guards a route on "is anyone logged in" and "is their email verified"
// (guide §2.4: email verification is required before ANY session-guarded
// route works, admin ones included). Whether that person is an admin is
// decided server-side per request — this never tries to duplicate that
// check client-side; see AppLayout's onForbidden handling for that path.
export function RequireSession() {
  const { sessionExists, loading, emailVerified } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!sessionExists) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (emailVerified === false) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />
  }

  return <Outlet />
}
