import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "./chart-tooltip"
import { AXIS, GRID, seriesColor } from "./theme"

type Row = Record<string, unknown>

/**
 * Horizontal bars for a single measure across categories — success rate per
 * step, cost per company, requirement coverage. Horizontal because category
 * labels are words ("certification_analysis"), and words rotated 45° on an
 * x-axis are the usual reason a dashboard is unreadable.
 *
 * Composition across more than two slices belongs here too: this is what a
 * pie chart should have been.
 */
export function CategoryBars({
  data,
  categoryKey,
  valueKey,
  label,
  valueFormat,
  categoryFormat,
  colorIndex = 0,
  height,
  ariaLabel,
}: {
  data: Row[]
  categoryKey: string
  valueKey: string
  /** Translated name of the measure — used by the tooltip. */
  label: string
  valueFormat: (value: number | null | undefined) => string
  /** Translates a stable English key into display text. */
  categoryFormat?: (value: string) => string
  /** Which palette slot — fixed per entity, never cycled. */
  colorIndex?: number
  height?: number
  ariaLabel?: string
}) {
  // Rows are the vertical axis here, so the chart grows with the data
  // rather than squeezing twenty categories into a fixed box.
  const resolvedHeight = height ?? Math.max(160, data.length * 28 + 48)

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={resolvedHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
        >
          <CartesianGrid {...GRID} vertical horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => valueFormat(value as number)}
            stroke={AXIS.stroke}
            tick={AXIS.tick}
            tickLine={AXIS.tickLine}
            axisLine={AXIS.axisLine}
          />
          <YAxis
            type="category"
            dataKey={categoryKey}
            tickFormatter={categoryFormat}
            stroke={AXIS.stroke}
            tick={AXIS.tick}
            tickLine={AXIS.tickLine}
            axisLine={AXIS.axisLine}
            width={150}
          />
          <Tooltip
            cursor={{ fill: "var(--row-hover)" }}
            content={
              <ChartTooltip valueFormat={valueFormat} labelFormat={categoryFormat} />
            }
          />
          <Bar
            dataKey={valueKey}
            name={label}
            fill={seriesColor(colorIndex)}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          >
            {/* Direct labels: at this density they beat a legend, and they
                are what makes the lighter palette slots legible. */}
            <LabelList
              dataKey={valueKey}
              position="right"
              formatter={(value: unknown) =>
                valueFormat(typeof value === "number" ? value : null)
              }
              style={{ fill: "var(--ink-500)", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
