// The back-office has two faces, and the split is deliberate rather than
// cosmetic: Knowledge is entity-centric and write-heavy (edit the canonical
// source material), Admin is window-centric and read-only (observe the
// running system). They also have opposite caching rules — the knowledge
// face polls, while /admin/customers/* must never be polled because every
// call writes an immutable audit row (metrics guide §2). Keeping them as
// separate shells gives that rule a boundary to live on.

export type FaceId = "knowledge" | "admin"

export type NavItem = {
  to: string
  /** i18n key under `nav.` */
  labelKey: string
}

export type Face = {
  id: FaceId
  /** i18n key under `face.` */
  labelKey: string
  home: string
  nav: NavItem[]
  /** Dashboards and wide tables need more room than the editing surfaces. */
  maxWidth: string
}

// Only routes that exist are listed — a nav item is not a roadmap. The
// remaining admin route (/admin/report) joins this list when it ships.
export const FACES: Record<FaceId, Face> = {
  knowledge: {
    id: "knowledge",
    labelKey: "face.knowledge",
    home: "/knowledge/sources",
    nav: [
      { to: "/knowledge/sources", labelKey: "nav.sources" },
      { to: "/knowledge/requirements", labelKey: "nav.requirements" },
    ],
    maxWidth: "max-w-[1120px]",
  },
  admin: {
    id: "admin",
    labelKey: "face.admin",
    home: "/admin/overview",
    nav: [
      { to: "/admin/overview", labelKey: "nav.overview" },
      { to: "/admin/queue", labelKey: "nav.queue" },
      { to: "/admin/pipeline", labelKey: "nav.pipeline" },
      { to: "/admin/costs", labelKey: "nav.costs" },
      { to: "/admin/customers", labelKey: "nav.customers" },
      { to: "/admin/efficacy", labelKey: "nav.efficacy" },
    ],
    maxWidth: "max-w-[1440px]",
  },
}

export const FACE_ORDER: FaceId[] = ["knowledge", "admin"]

const DEFAULT_FACE: FaceId = "knowledge"
const LAST_FACE_KEY = "digba.backoffice.lastFace"

export function faceFromPathname(pathname: string): FaceId {
  return pathname.startsWith("/admin") ? "admin" : DEFAULT_FACE
}

// Which face "/" lands on. Remembering it means someone who lives in the
// admin face all day doesn't pass through Sources every morning.
export function readLastFace(): FaceId {
  try {
    const stored = window.localStorage.getItem(LAST_FACE_KEY)
    if (stored === "knowledge" || stored === "admin") return stored
  } catch {
    // Private mode / blocked storage — the default is a fine answer.
  }
  return DEFAULT_FACE
}

export function writeLastFace(face: FaceId): void {
  try {
    window.localStorage.setItem(LAST_FACE_KEY, face)
  } catch {
    // Non-fatal: the switcher still works, it just won't be remembered.
  }
}
