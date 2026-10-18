import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
 * Line or area over a date axis. One y-axis, always — cost and volume are
 * two stacked charts sharing an x-axis, never two scales on one chart,
 * which is the single most common way a dashboard misleads. There is
 * deliberately no prop to add a second one.
 *
 * Gaps are gaps: a `null` in the data breaks the line rather than being
 * drawn as zero (`connectNulls` stays off).
 */
export function TimeSeries({
  data,
  xKey,
  series,
  variant = "line",
  stacked = false,
  window,
  valueFormat,
  labelFormat,
  tickFormat,
  height = CHART_HEIGHT,
  ariaLabel,
}: {
  data: Row[]
  xKey: string
  series: SeriesSpec[]
  variant?: "line" | "area"
  /** Area only — composition over time, e.g. cost by role. */
  stacked?: boolean
  /** Draws the in-progress-day marker when the window includes today. */
  window?: MetricsWindow
  valueFormat: (value: number | null | undefined) => string
  /** Formats the x tick and the tooltip heading, e.g. a date. */
  labelFormat?: (value: string) => string
  /** Y-axis ticks, when the full value format is too verbose for an axis. */
  tickFormat?: (value: number | null | undefined) => string
  height?: number
  ariaLabel?: string
}) {
  const { shown } = capSeries(series)
  const Chart = variant === "area" ? AreaChart : LineChart

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
            cursor={{ stroke: "var(--ink-400)", strokeDasharray: "2 4" }}
            content={
              <ChartTooltip valueFormat={valueFormat} labelFormat={labelFormat} />
            }
          />
          {shown.length > 1 ? (
            <Legend
              verticalAlign="bottom"
              height={28}
              wrapperStyle={{ fontSize: 12, color: "var(--ink-500)" }}
            />
          ) : null}

          {/* The backend keeps today's partial data because on a live
              dashboard it is often the most interesting point — but drawn
              plain it shows a cliff that reads as an outage, so it is
              marked rather than dropped (metrics guide §8.4). */}
          {window?.includes_partial_day ? (
            <ReferenceLine
              x={window.last_day}
              stroke="var(--ink-400)"
              strokeDasharray="3 3"
            />
          ) : null}

          {shown.map((spec, index) =>
            variant === "area" ? (
              <Area
                key={spec.key}
                type="monotone"
                dataKey={spec.key}
                name={spec.label}
                stackId={stacked ? "stack" : undefined}
                stroke={seriesColor(index)}
                fill={seriesColor(index)}
                fillOpacity={stacked ? 0.85 : 0.15}
                strokeWidth={2}
                connectNulls={false}
                dot={false}
              />
            ) : (
              <Line
                key={spec.key}
                type="monotone"
                dataKey={spec.key}
                name={spec.label}
                stroke={seriesColor(index)}
                strokeWidth={2}
                connectNulls={false}
                dot={false}
                activeDot={{ r: 3 }}
              />
            )
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}
