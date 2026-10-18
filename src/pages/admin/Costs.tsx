import * as React from "react"
import { useTranslation } from "react-i18next"

import { CategoryBars } from "@/components/charts/category-bars"
import { SeriesTable } from "@/components/charts/series-table"
import { TimeSeries } from "@/components/charts/time-series"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatCount,
  formatDay,
  formatUsd,
  formatUsdCompact,
  humanizeKey,
} from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useMetricsCosts } from "./queries"
import type { CostByCompany, CostDaily } from "./types"
import { WindowPicker } from "./WindowPicker"
import { useMetricsWindow } from "./window"

/** Past this many day buckets, a daily stacked area is a smear. */
const WEEKLY_THRESHOLD = 35
const TOP_COMPANIES = 10

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** Monday of the week containing `iso`, as YYYY-MM-DD in local time. */
function weekStart(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Long rows (one per day × role × model × operation) pivoted to one row per
 * bucket with a column per role.
 *
 * `cost_usd` is null when a call had no rate at all. Those are skipped
 * rather than counted as zero — which is why `unpriced_calls` is surfaced
 * as a warning on this page and not as a footnote: a chart that silently
 * treats unpriced as free is exactly the quiet lie this page exists to
 * avoid.
 */
function pivotByRole(
  rows: CostDaily[],
  weekly: boolean
): { buckets: Record<string, number | string>[]; roles: string[] } {
  const roles = [...new Set(rows.map((row) => row.role))].sort()
  const buckets = new Map<string, Record<string, number | string>>()

  for (const row of rows) {
    if (row.cost_usd === null) continue
    const bucket = weekly ? weekStart(row.day) : row.day.slice(0, 10)
    let entry = buckets.get(bucket)
    if (!entry) {
      entry = { bucket }
      for (const role of roles) entry[role] = 0
      buckets.set(bucket, entry)
    }
    entry[row.role] = (entry[row.role] as number) + row.cost_usd
  }

  return {
    buckets: [...buckets.values()].sort((a, b) =>
      String(a.bucket).localeCompare(String(b.bucket))
    ),
    roles,
  }
}

/**
 * Top N by spend with the tail folded into one "Other" row. Folding rather
 * than truncating keeps the total honest — a reader who adds the bars up
 * should land on the number in the tile.
 */
function topWithOther(
  rows: CostByCompany[],
  otherLabel: string
): { company_name: string; cost_usd: number }[] {
  const priced = rows
    .map((row) => ({ company_name: row.company_name, cost_usd: row.cost_usd ?? 0 }))
    .sort((a, b) => b.cost_usd - a.cost_usd)

  if (priced.length <= TOP_COMPANIES) return priced

  const head = priced.slice(0, TOP_COMPANIES)
  const tail = priced.slice(TOP_COMPANIES)
  return [
    ...head,
    {
      company_name: otherLabel,
      cost_usd: tail.reduce((total, row) => total + row.cost_usd, 0),
    },
  ]
}

export function Costs() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { params, setWindow } = useMetricsWindow()
  const costs = useMetricsCosts(params)
  const keyLabel = useKeyLabel()

  const data = costs.data
  const usd = (value: number | null | undefined) => formatUsd(value, language)
  const usdAxis = (value: number | null | undefined) => formatUsdCompact(value, language)
  const count = (value: number | null | undefined) => formatCount(value, language)
  const day = (value: string) => formatDay(value, language)

  const daily = React.useMemo(() => data?.daily ?? [], [data])
  const byCompany = React.useMemo(() => data?.by_company ?? [], [data])

  const totals = React.useMemo(() => {
    let spend = 0
    let wasted = 0
    let calls = 0
    let unpriced = 0
    let anyPriced = false
    for (const row of daily) {
      if (row.cost_usd !== null) {
        spend += row.cost_usd
        anyPriced = true
      }
      if (row.wasted_usd !== null) wasted += row.wasted_usd
      calls += row.calls
      unpriced += row.calls - row.priced_calls
    }
    // Nothing priced at all is "—", not "$0.00".
    return { spend: anyPriced ? spend : null, wasted, calls, unpriced }
  }, [daily])

  const dayCount = React.useMemo(
    () => new Set(daily.map((row) => row.day.slice(0, 10))).size,
    [daily]
  )
  const weekly = dayCount > WEEKLY_THRESHOLD

  const { buckets, roles } = React.useMemo(
    () => pivotByRole(daily, weekly),
    [daily, weekly]
  )

  const roleSeries = roles.map((role) => ({
    key: role,
    label: keyLabel("costRole", role),
  }))

  const companyRows = React.useMemo(
    () => topWithOther(byCompany, t("admin.costs.other")),
    [byCompany, t]
  )

  const byOperation = React.useMemo(() => {
    const totalsByOperation = new Map<string, number>()
    for (const row of daily) {
      if (row.cost_usd === null) continue
      totalsByOperation.set(
        row.operation,
        (totalsByOperation.get(row.operation) ?? 0) + row.cost_usd
      )
    }
    return [...totalsByOperation.entries()]
      .map(([operation, cost_usd]) => ({ operation, cost_usd }))
      .sort((a, b) => b.cost_usd - a.cost_usd)
  }, [daily])

  // The newest card tells the reader how old every figure on the page is.
  const newestRate = React.useMemo(() => {
    const cards = data?.rate_card ?? []
    return cards.reduce<(typeof cards)[number] | undefined>(
      (newest, card) =>
        !newest || card.effective_from > newest.effective_from ? card : newest,
      undefined
    )
  }, [data])

  const retry = () => void costs.refetch()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {t("admin.costs.title")}
        </h1>
        <WindowPicker params={params} onChange={setWindow} window={data?.window} />
      </header>

      {costs.isError ? <PanelError error={costs.error} onRetry={retry} /> : null}

      {/* Not a footnote: if part of the spend has no rate, the headline
          number is incomplete and the reader has to know before deciding
          anything with it. */}
      {totals.unpriced > 0 ? (
        <Alert>
          <AlertDescription>
            {t("admin.costs.unpricedWarning", { count: totals.unpriced })}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {costs.isPending || !data ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
          ))
        ) : (
          <>
            <StatTile
              label={t("admin.costs.spend")}
              value={usd(totals.spend)}
              caption={
                newestRate
                  ? t("admin.costs.rateProvenance", {
                      date: formatDay(newestRate.effective_from, language),
                    })
                  : undefined
              }
            />
            <StatTile
              label={t("admin.costs.wasted")}
              value={usd(totals.wasted)}
              caption={t("admin.costs.wastedHint")}
            />
            <StatTile label={t("admin.costs.calls")} value={count(totals.calls)} />
            <StatTile
              label={t("admin.costs.unpriced")}
              value={count(totals.unpriced)}
            />
          </>
        )}
      </div>

      <Panel
        title={t("admin.costs.overTimeTitle")}
        caption={weekly ? t("admin.costs.weeklyBuckets") : t("admin.costs.dailyBuckets")}
        isLoading={costs.isPending}
        isEmpty={buckets.length === 0}
        error={costs.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={buckets}
            rowKey="bucket"
            rowLabel={weekly ? t("admin.costs.week") : t("admin.costs.day")}
            rowFormat={day}
            series={roleSeries}
            valueFormat={usd}
          />
        }
      >
        <TimeSeries
          data={buckets}
          xKey="bucket"
          series={roleSeries}
          variant="area"
          stacked
          window={weekly ? undefined : data?.window}
          valueFormat={usd}
          tickFormat={usdAxis}
          labelFormat={day}
          ariaLabel={t("admin.costs.overTimeTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.costs.perCompanyTitle")}
        caption={
          byCompany.length > TOP_COMPANIES
            ? t("admin.costs.foldedTail", { count: TOP_COMPANIES })
            : undefined
        }
        isLoading={costs.isPending}
        isEmpty={companyRows.length === 0}
        error={costs.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={companyRows}
            rowKey="company_name"
            rowLabel={t("admin.costs.company")}
            series={[{ key: "cost_usd", label: t("admin.costs.spend") }]}
            valueFormat={usd}
          />
        }
      >
        <CategoryBars
          data={companyRows}
          categoryKey="company_name"
          valueKey="cost_usd"
          label={t("admin.costs.spend")}
          valueFormat={usd}
          ariaLabel={t("admin.costs.perCompanyTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.costs.perOperationTitle")}
        isLoading={costs.isPending}
        isEmpty={byOperation.length === 0}
        error={costs.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={byOperation}
            rowKey="operation"
            rowLabel={t("admin.costs.operation")}
            rowFormat={(value) => keyLabel("operation", value)}
            series={[{ key: "cost_usd", label: t("admin.costs.spend") }]}
            valueFormat={usd}
          />
        }
      >
        <CategoryBars
          data={byOperation}
          categoryKey="operation"
          valueKey="cost_usd"
          label={t("admin.costs.spend")}
          valueFormat={usd}
          categoryFormat={(value) => keyLabel("operation", value)}
          colorIndex={1}
          ariaLabel={t("admin.costs.perOperationTitle")}
        />
      </Panel>

      {newestRate ? (
        <p className="text-[12px] text-ink-400">
          {t("admin.costs.rateSource", {
            date: formatDay(newestRate.effective_from, language),
            source: newestRate.source,
            model: humanizeKey(newestRate.model),
          })}
        </p>
      ) : null}
    </div>
  )
}
