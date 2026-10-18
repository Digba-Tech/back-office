import * as React from "react"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthProvider"
import digbaLogo from "@/assets/digba-logo.png"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { onForbidden } from "@/lib/api"
import { FACES, FACE_ORDER, faceFromPathname, writeLastFace } from "@/lib/faces"
import type { FaceId } from "@/lib/faces"
import { cn } from "@/lib/utils"
import { NotAuthorized } from "@/pages/NotAuthorized"

export function AppLayout() {
  const { t } = useTranslation()
  const { email, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [forbidden, setForbidden] = React.useState(false)

  // The URL is the source of truth for which face is showing, so a pasted
  // link lands on the right shell without any stored state agreeing first.
  const faceId = faceFromPathname(location.pathname)
  const face = FACES[faceId]

  React.useEffect(() => onForbidden(() => setForbidden(true)), [])

  React.useEffect(() => {
    writeLastFace(faceId)
  }, [faceId])

  // Any backend 403 latches this layout into the dead-end screen (guide §2:
  // don't retry automatically). Navigating elsewhere clears it — the next
  // request will re-latch it if the account is still unauthorized.
  React.useEffect(() => {
    setForbidden(false)
  }, [location.pathname])

  if (forbidden) {
    return <NotAuthorized email={email} onSignOut={() => void signOut()} />
  }

  const faceOptions = FACE_ORDER.map((id) => ({
    value: id,
    label: t(FACES[id].labelKey),
  }))

  function onFaceChange(next: FaceId) {
    if (next !== faceId) navigate(FACES[next].home)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-6 px-4 py-3",
            face.maxWidth
          )}
        >
          <div className="flex items-center gap-5">
            <img src={digbaLogo} alt="digba" className="h-8 w-auto" />
            <SegmentedControl
              options={faceOptions}
              value={faceId}
              onChange={onFaceChange}
              className="shrink-0"
            />
            <span aria-hidden="true" className="h-6 w-px bg-line" />
            <nav className="flex items-center gap-1">
              {face.nav.map((item) => (
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
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="hidden text-[13px] text-ink-500 lg:inline">{email}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void signOut()}
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
              className="cursor-pointer text-ink-500 hover:text-ink-700"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>
      <main className={cn("w-full flex-1 px-4 pt-10 pb-6", face.maxWidth, "mx-auto")}>
        <React.Suspense fallback={<div className="h-64" />}>
          <Outlet />
        </React.Suspense>
      </main>
    </div>
  )
}
