import { seriesColor } from "./theme"

type Entry = {
  dataKey?: string | number
  name?: string | number
  value?: number | string | null
  color?: string
}

/**
 * Recharts' default tooltip prints raw JSON numbers, which in French would
 * show a period decimal separator and no thousands grouping. Every value
 * goes through the panel's own formatter instead — which is also what
 * renders a `null` as "—" rather than 0.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormat,
  valueFormat,
}: {
  active?: boolean
  payload?: Entry[]
  label?: string | number
  labelFormat?: (label: string) => string
  valueFormat: (value: number | null | undefined) => string
}) {
  if (!active || !payload?.length) return null

  const heading =
    typeof label === "string" && labelFormat ? labelFormat(label) : String(label ?? "")

  return (
    <div className="rounded-md border border-line bg-card px-3 py-2 shadow-[var(--shadow-overlay)]">
      <p className="mb-1 font-mono text-[11px] tracking-wide text-ink-400 uppercase">
        {heading}
      </p>
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li
            key={String(entry.dataKey ?? index)}
            className="flex items-center gap-2 text-[12px] text-ink-700"
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: entry.color ?? seriesColor(index) }}
            />
            <span className="text-ink-500">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {valueFormat(typeof entry.value === "number" ? entry.value : null)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
