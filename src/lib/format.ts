// Locale-aware formatting for every number, date and duration the app
// renders. Two rules are enforced here rather than per panel:
//
//   1. `null` is not `0`. `success_pct: null` means "no runs in this
//      window", not a 0% success rate; `cost.usd: null` means "nothing was
//      priced", not free. Both render as an em dash (metrics guide §4.1).
//      A quiet Sunday showing "0% success" causes a panic; a cost page
//      showing "$0.00" causes a worse decision.
//   2. Numbers go through Intl, never `toFixed`. `fr-FR` uses a comma
//      decimal separator and a narrow-space thousands separator, so a
//      hardcoded `toFixed(2)` looks broken in French.
//
// Values arrive as JSON numbers already rounded at source (money to 6dp,
// percentages to 1dp), so nothing here re-rounds upward, and no caller
// should sum rounded values and expect them to match a total.

/** What a missing value looks like everywhere. Never "0", never blank. */
export const NO_VALUE = "—"

type Nullable = number | null | undefined

function isMissing(value: Nullable): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value)
}

export function formatNumber(
  value: Nullable,
  language: string,
  options?: Intl.NumberFormatOptions
): string {
  if (isMissing(value)) return NO_VALUE
  return new Intl.NumberFormat(language, options).format(value)
}

/** Counts: no decimals, grouped. */
export function formatCount(value: Nullable, language: string): string {
  return formatNumber(value, language, { maximumFractionDigits: 0 })
}

/**
 * Percentages arrive already rounded to 1dp. `null` means "no runs in this
 * window" — the single most dangerous value in the API to render as a
 * number.
 */
export function formatPercent(value: Nullable, language: string): string {
  if (isMissing(value)) return NO_VALUE
  return new Intl.NumberFormat(language, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * USD, with enough precision to stay honest at the low end: a model call
 * costing $0.0218 must not render as "$0.02" on a page whose whole purpose
 * is cost attribution, and must never render as "$0.00".
 */
export function formatUsd(value: Nullable, language: string): string {
  if (isMissing(value)) return NO_VALUE
  const magnitude = Math.abs(value)
  const maximumFractionDigits = magnitude !== 0 && magnitude < 0.01 ? 6 : 2
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Axis-sized money. An axis with five ticks reading "$1,240.00" wastes the
 * width that the chart needs, so ticks get compact notation while the
 * tooltip and the tiles keep full precision.
 */
export function formatUsdCompact(value: Nullable, language: string): string {
  if (isMissing(value)) return NO_VALUE
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Durations come from the API in milliseconds (`p50_ms`, `p95_ms`). Intl's
 * unit style keeps the suffix locale-correct rather than hardcoding "ms".
 */
export function formatDuration(ms: Nullable, language: string): string {
  if (isMissing(ms)) return NO_VALUE

  const unit =
    ms < 1000
      ? { unit: "millisecond" as const, value: ms, digits: 0 }
      : ms < 60_000
        ? { unit: "second" as const, value: ms / 1000, digits: 1 }
        : ms < 3_600_000
          ? { unit: "minute" as const, value: ms / 60_000, digits: 1 }
          : { unit: "hour" as const, value: ms / 3_600_000, digits: 1 }

  return new Intl.NumberFormat(language, {
    style: "unit",
    unit: unit.unit,
    unitDisplay: "short",
    maximumFractionDigits: unit.digits,
  }).format(unit.value)
}

/** Resolution times arrive in hours (`p50_hours`, `p90_hours`). */
export function formatHours(hours: Nullable, language: string): string {
  if (isMissing(hours)) return NO_VALUE
  if (hours >= 48) {
    return new Intl.NumberFormat(language, {
      style: "unit",
      unit: "day",
      unitDisplay: "short",
      maximumFractionDigits: 1,
    }).format(hours / 24)
  }
  return new Intl.NumberFormat(language, {
    style: "unit",
    unit: "hour",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(hours)
}

// Centralizes locale-aware date formatting so every page renders timestamps
// in the viewer's current language (en-US vs fr-FR conventions differ:
// month/day order, "AM/PM" vs 24h, etc.) instead of hardcoding one.
export function formatDateTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language)
}

/** Date-only, for day buckets and `YYYY-MM-DD` window bounds. */
export function formatDay(iso: string | null | undefined, language: string): string {
  if (!iso) return NO_VALUE
  // A bare "YYYY-MM-DD" parses as UTC midnight, which renders as the
  // previous day west of Greenwich. Pin it to local time instead.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Open key sets (pipeline `step`, `operation`, `standard`, `role`) are free
 * TEXT by design, so a new analyzer can ship without a migration. When no
 * translation exists, show a humanised key rather than a blank cell.
 */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, " ").trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
