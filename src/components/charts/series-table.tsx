import { Link } from "react-router-dom"

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
  rowHref,
}: {
  data: Row[]
  /** Key of the first column — the x axis, in table form. */
  rowKey: string
  rowLabel: string
  rowFormat?: (value: string) => string
  series: SeriesSpec[]
  valueFormat: (value: number | null | undefined) => string
  /**
   * Turns the first column into a link. This is the keyboard-and-screen-
   * reader half of a drill-down whose other half is a clickable bar: bars
   * cannot be focused, table rows can.
   */
  rowHref?: (row: Row) => string | undefined
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
            const label = rowFormat ? rowFormat(raw) : raw
            const href = rowHref?.(row)
            return (
              <TableRow key={`${raw}-${index}`}>
                <TableCell className="whitespace-nowrap">
                  {href ? (
                    <Link
                      to={href}
                      className="text-navy underline-offset-4 hover:underline"
                    >
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
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
