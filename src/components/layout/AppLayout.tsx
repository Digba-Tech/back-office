import * as React from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { onForbidden } from "@/lib/api"
import { cn } from "@/lib/utils"
import { NotAuthorized } from "@/pages/NotAuthorized"

const NAV_ITEMS = [
  { to: "/sources", label: "Sources" },
  { to: "/requirements", label: "Requirements" },
]

export function AppLayout() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const [forbidden, setForbidden] = React.useState(false)

  React.useEffect(() => onForbidden(() => setForbidden(true)), [])

  // Any backend 403 latches this layout into the dead-end screen (guide §2:
  // don't retry automatically). Navigating elsewhere clears it — the next
  // request will re-latch it if the account is still unauthorized.
  React.useEffect(() => {
    setForbidden(false)
  }, [location.pathname])

  if (forbidden) {
    return (
      <NotAuthorized email={session?.user.email} onSignOut={() => void signOut()} />
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground",
                    isActive && "text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session?.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
