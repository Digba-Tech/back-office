import { useTranslation } from "react-i18next"

import { SegmentedControl } from "@/components/segmented-control"
import { formatDay } from "@/lib/format"

import type { MetricsWindow, WindowParams } from "./window"

const PRESETS = ["7", "30", "90"] as const
type Preset = (typeof PRESETS)[number]

/** The backend's own default when `since` is absent. */
const DEFAULT_PRESET: Preset = "30"

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const pad = (n: number) => String(n).padStart(2, "0")
  // Built from local parts, not toISOString(), which would shift the date
  // across midnight for anyone east of UTC.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * The shared range control for the admin face. Writes to the query string,
 * so the view is linkable.
 *
 * What it shows below the control is the window the *backend* reports
 * having used, not the one this control asked for — those can differ, and
 * the response is the authority.
 */
export function WindowPicker({
  params,
  onChange,
  window,
}: {
  params: WindowParams
  onChange: (next: WindowParams) => void
  window?: MetricsWindow
}) {
  const { t, i18n } = useTranslation()

  const active: Preset =
    params.until || params.since
      ? (PRESETS.find((preset) => daysAgo(Number(preset)) === params.since) ??
        DEFAULT_PRESET)
      : DEFAULT_PRESET

  const options = PRESETS.map((preset) => ({
    value: preset,
    label: t(`admin.window.last${preset}`),
  }))

  return (
    <div className="flex flex-col items-start gap-1.5">
      <SegmentedControl
        options={options}
        value={active}
        onChange={(preset) => onChange({ since: daysAgo(Number(preset)) })}
      />
      {window ? (
        <p className="text-[12px] text-ink-400">
          {t("admin.window.showing", {
            since: formatDay(window.since, i18n.language),
            until: formatDay(window.until ?? window.last_day, i18n.language),
          })}
        </p>
      ) : null}
    </div>
  )
}
