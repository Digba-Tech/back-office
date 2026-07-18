import * as React from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { onForbidden } from "@/lib/api"
import { cn } from "@/lib/utils"
import { NotAuthorized } from "@/pages/NotAuthorized"

export function AppLayout() {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const location = useLocation()
  const [forbidden, setForbidden] = React.useState(false)

  const navItems = [
    { to: "/sources", label: t("nav.sources") },
    { to: "/requirements", label: t("nav.requirements") },
  ]

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
            {navItems.map((item) => (
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
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground">
              {session?.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              {t("nav.logout")}
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
