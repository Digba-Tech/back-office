import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { SeriesSpec } from "./theme"

type Row = Record<string, unknown>

/**
 * The table half of every panel's chart/table toggle. Same rows, same
 * formatter — so the two views can never disagree about a number, which is
 * the whole point of offering the toggle rather than a separate export.
 */
export function SeriesTable({
  data,
  rowKey,
  rowLabel,
  rowFormat,
  series,
  valueFormat,
}: {
  data: Row[]
  /** Key of the first column — the x axis, in table form. */
  rowKey: string
  rowLabel: string
  rowFormat?: (value: string) => string
  series: SeriesSpec[]
  valueFormat: (value: number | null | undefined) => string
}) {
  return (
    <div className="max-h-[320px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{rowLabel}</TableHead>
            {series.map((spec) => (
              <TableHead key={spec.key} className="text-right">
                {spec.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const raw = String(row[rowKey] ?? "")
            return (
              <TableRow key={`${raw}-${index}`}>
                <TableCell className="whitespace-nowrap">
                  {rowFormat ? rowFormat(raw) : raw}
                </TableCell>
                {series.map((spec) => {
                  const value = row[spec.key]
                  return (
                    <TableCell key={spec.key} className="text-right tabular-nums">
                      {valueFormat(typeof value === "number" ? value : null)}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
