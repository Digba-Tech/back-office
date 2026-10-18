import * as React from "react"
import { useSearchParams } from "react-router-dom"

// Every metrics endpoint takes the same window, so one date range threads
// through the whole admin face. It lives in the URL rather than in React
// state: a panel someone can paste into Slack and have open the same view
// is worth more than one that resets on reload.

/**
 * The window the backend actually used, echoed on every metrics response.
 * It is the authority — not the UI's own idea of the range — which is why
 * an absent `since` is left absent rather than materialised client-side.
 */
export type MetricsWindow = {
  since: string
  until: string | null
  /** The last day covered, even when `until` is open-ended. */
  last_day: string
  /** True when `last_day` is today and covers only a few hours so far. */
  includes_partial_day: boolean
}

export type WindowParams = { since?: string; until?: string }

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reads the shared window from the query string. Anything malformed is
 * dropped rather than forwarded — the backend 422s on a bad date, and a
 * hand-edited URL shouldn't turn every panel on the page into an error.
 *
 * Omitting `since` is meaningful: the backend then applies its own default
 * of 30 days, and the response says what it used.
 */
export function useMetricsWindow(): {
  params: WindowParams
  setWindow: (next: WindowParams) => void
} {
  const [search, setSearch] = useSearchParams()
  const since = search.get("since")
  const until = search.get("until")

  const params = React.useMemo<WindowParams>(
    () => ({
      since: since && DATE.test(since) ? since : undefined,
      until: until && DATE.test(until) ? until : undefined,
    }),
    [since, until]
  )

  // Pushes rather than replaces, so Back undoes a range change — this is
  // called when a range is committed, not on every keystroke.
  const setWindow = React.useCallback(
    (next: WindowParams) => {
      setSearch((current) => {
        const updated = new URLSearchParams(current)
        for (const key of ["since", "until"] as const) {
          const value = next[key]
          if (value) updated.set(key, value)
          else updated.delete(key)
        }
        return updated
      })
    },
    [setSearch]
  )

  return { params, setWindow }
}

/**
 * Whether a day bucket is the in-progress one. The backend deliberately
 * keeps today's partial data because on a live dashboard it is often the
 * most interesting point — but rendering it like a complete day shows a
 * cliff that reads as an outage, so every series marks it (guide §8.4).
 */
export function isPartialDay(
  window: MetricsWindow | undefined,
  day: string
): boolean {
  if (!window?.includes_partial_day) return false
  return window.last_day === day.slice(0, 10)
}
