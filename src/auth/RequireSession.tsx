import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import { NotAuthorized } from "@/pages/NotAuthorized"

// Guards a route on "is anyone logged in", "is their email verified" (guide
// §2.4: required before ANY session-guarded route works, admin ones
// included), and "is this session an admin" (guide §3.5: a valid session is
// NOT an admin session — any email can sign up — so the app shell itself
// must turn non-admins away before rendering the dashboard or firing any
// /api/v2/admin/* calls, rather than waiting on those calls' 403s).
export function RequireSession() {
  const { sessionExists, loading, emailVerified, role, email, signOut } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!sessionExists) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (emailVerified === false) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />
  }

  if (role !== "admin") {
    return <NotAuthorized email={email} onSignOut={() => void signOut()} />
  }

  return <Outlet />
}
