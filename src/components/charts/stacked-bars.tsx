import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { MetricsWindow } from "@/pages/admin/window"

import { ChartTooltip } from "./chart-tooltip"
import { AXIS, CHART_HEIGHT, GRID, capSeries, seriesColor } from "./theme"
import type { SeriesSpec } from "./theme"

type Row = Record<string, unknown>

/**
 * Composition over a date axis — documents by status per day, attempts by
 * outcome. A legend is always present, since a stack cannot carry direct
 * labels, and segments are separated by a 2px surface-coloured gap so
 * adjacent bands stay countable.
 *
 * `palette: "status"` is for the good/warning/serious/critical scale, which
 * is reserved and never reused as a series colour.
 */
export function StackedBars({
  data,
  xKey,
  series,
  window,
  valueFormat,
  labelFormat,
  tickFormat,
  colors,
  height = CHART_HEIGHT,
  ariaLabel,
}: {
  data: Row[]
  xKey: string
  series: SeriesSpec[]
  window?: MetricsWindow
  valueFormat: (value: number | null | undefined) => string
  labelFormat?: (value: string) => string
  tickFormat?: (value: number | null | undefined) => string
  /** Explicit colours — use for status scales, which are not series colours. */
  colors?: string[]
  height?: number
  ariaLabel?: string
}) {
  const { shown } = capSeries(series)

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis
            dataKey={xKey}
            tickFormatter={labelFormat}
            stroke={AXIS.stroke}
            tick={AXIS.tick}
            tickLine={AXIS.tickLine}
            axisLine={AXIS.axisLine}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value) => (tickFormat ?? valueFormat)(value as number)}
            stroke={AXIS.stroke}
            tick={AXIS.tick}
            tickLine={AXIS.tickLine}
            axisLine={AXIS.axisLine}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--row-hover)" }}
            content={
              <ChartTooltip valueFormat={valueFormat} labelFormat={labelFormat} />
            }
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            wrapperStyle={{ fontSize: 12, color: "var(--ink-500)" }}
          />
          {window?.includes_partial_day ? (
            <ReferenceLine
              x={window.last_day}
              stroke="var(--ink-400)"
              strokeDasharray="3 3"
            />
          ) : null}
          {shown.map((spec, index) => (
            <Bar
              key={spec.key}
              dataKey={spec.key}
              name={spec.label}
              stackId="stack"
              fill={colors?.[index] ?? seriesColor(index)}
              stroke="var(--card)"
              strokeWidth={2}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
