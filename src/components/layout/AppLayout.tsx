import * as React from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import digbaLogo from "@/assets/digba-logo.png"
import { LanguageSwitcher } from "@/components/language-switcher"
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
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <img src={digbaLogo} alt="digba" className="h-8 w-auto" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-700",
                      isActive && "bg-[rgba(82,179,70,0.15)] text-navy hover:text-navy"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-[13px] text-ink-500">{session?.user.email}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-ink-500 underline underline-offset-2 hover:text-ink-700"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-10 pb-6">
        <Outlet />
      </main>
    </div>
  )
}
