// Shared chart vocabulary. Everything here exists so the standing rules in
// the metrics guide (§5) are enforced in one place rather than remembered
// per panel.

export type SeriesSpec = {
  /** Key in the data row. */
  key: string
  /** Already-translated display label. */
  label: string
}

/**
 * The validated categorical palette, in fixed order. Colour follows the
 * series' position in the declared array — which the caller keeps stable —
 * so filtering one series out must never repaint the survivors.
 *
 * There is no fifth entry on purpose. Beyond four, facet into small
 * multiples or fold the tail into "Other"; a generated hue would not have
 * been checked for contrast or CVD separation.
 */
export const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
] as const

export const MAX_SERIES = SERIES_COLORS.length

export function seriesColor(index: number): string {
  return SERIES_COLORS[index] ?? SERIES_COLORS[SERIES_COLORS.length - 1]
}

/**
 * Caps a series list at four and reports the overflow so a panel can say
 * so out loud. Silently dropping series would be worse than the rule it
 * enforces, and cycling the palette — the other obvious option — would
 * give two different entities the same colour.
 */
export function capSeries(series: SeriesSpec[]): {
  shown: SeriesSpec[]
  hidden: SeriesSpec[]
} {
  if (series.length <= MAX_SERIES) return { shown: series, hidden: [] }
  if (import.meta.env.DEV) {
    console.error(
      `[charts] ${series.length} series passed; the validated palette has ${MAX_SERIES}. ` +
        `Facet into small multiples or fold the tail into "Other" before rendering.`
    )
  }
  return { shown: series.slice(0, MAX_SERIES), hidden: series.slice(MAX_SERIES) }
}

// Axes and grid stay recessive: values and labels are in ink tokens, never
// in a series colour.
export const AXIS = {
  stroke: "var(--line)",
  tick: { fill: "var(--ink-500)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--line)" },
} as const

export const GRID = {
  stroke: "var(--line)",
  strokeDasharray: "2 4",
  vertical: false,
} as const

/** Shading for the in-progress day band. */
export const PARTIAL_DAY_FILL = "var(--paper)"

/**
 * The reserved status scale. Never drawn from the series palette, and
 * never used to mean "series 4" — amber meaning "warning" in one panel
 * and "Q3" in the next is how a dashboard stops being readable. Always
 * paired with a legend or a label, never colour alone.
 */
export const STATUS_COLORS = {
  good: "var(--primary)",
  attention: "var(--attention)",
  danger: "var(--danger)",
  neutral: "var(--ink-400)",
} as const

export const CHART_HEIGHT = 260
