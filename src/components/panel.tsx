import * as React from "react"
import { useTranslation } from "react-i18next"

import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, isAnalyticsTimeout } from "@/lib/api"
import { cn } from "@/lib/utils"

type View = "chart" | "table"

/**
 * The chrome every admin panel sits in, so the standing rules are enforced
 * once rather than remembered per panel.
 *
 * `table` is required, not optional: a "view as table" toggle on every
 * panel is both a stated rule (metrics guide §5) and the accessibility
 * relief that `--series-3`'s 2.98:1 contrast obliges. Making it a required
 * prop is the only way that survives contact with a deadline.
 */
export function Panel({
  title,
  caption,
  action,
  table,
  children,
  isLoading = false,
  isEmpty = false,
  error,
  onRetry,
  className,
}: {
  title: string
  /** Provenance or a caveat — rate-card date, partial-day note, "partial: N unpriced calls". */
  caption?: React.ReactNode
  /** Panel-local control, e.g. a grouping switch. */
  action?: React.ReactNode
  table: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  error?: unknown
  onRetry?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const [view, setView] = React.useState<View>("chart")

  const views = [
    { value: "chart" as const, label: t("admin.panel.viewChart") },
    { value: "table" as const, label: t("admin.panel.viewTable") },
  ]

  return (
    <section
      className={cn(
        "rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]",
        className
      )}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-[17px] leading-tight font-semibold text-navy">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {action}
          <SegmentedControl options={views} value={view} onChange={setView} />
        </div>
      </header>

      {isLoading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : error ? (
        <PanelError error={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <p className="py-10 text-center text-sm text-ink-500">
          {t("admin.panel.empty")}
        </p>
      ) : view === "chart" ? (
        children
      ) : (
        table
      )}

      {caption ? (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-400">{caption}</p>
      ) : null}
    </section>
  )
}

// A 30s analytics timeout has an actual remedy — narrow the window — so it
// gets its own message rather than a generic failure. Branching on the
// body's `reason` rather than its `detail`, which is translated prose
// (metrics guide §8.7).
export function PanelError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()

  const message = isAnalyticsTimeout(error)
    ? t("admin.panel.timeout")
    : t("admin.panel.loadFailed", {
        message: error instanceof ApiError || error instanceof Error
          ? error.message
          : String(error),
      })

  return (
    <div className="flex flex-col items-start gap-3 rounded-md bg-danger-tint px-4 py-3">
      <p className="text-sm text-ink-700">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t("admin.panel.retry")}
        </Button>
      ) : null}
    </div>
  )
}
