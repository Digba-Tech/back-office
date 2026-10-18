import * as React from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { SeriesTable } from "@/components/charts/series-table"
import { StackedBars } from "@/components/charts/stacked-bars"
import { STATUS_COLORS } from "@/components/charts/theme"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatCount,
  formatDay,
  formatPercent,
  formatUsd,
} from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useMetricsReport } from "./queries"

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Direction and judgement for a month-over-month change. The caller says
 * which way is good, because the chart cannot know: spend rising and
 * signups rising are both "up".
 */
function delta(
  current: number | null,
  previous: number | null | undefined,
  goodWhen: "up" | "down"
): { trend: "up" | "down" | "flat"; sentiment: "good" | "bad" | "neutral"; pct: number } | null {
  if (current === null || previous === null || previous === undefined) return null
  if (previous === 0) return null
  const change = ((current - previous) / Math.abs(previous)) * 100
  const trend = change > 0.5 ? "up" : change < -0.5 ? "down" : "flat"
  const sentiment =
    trend === "flat"
      ? "neutral"
      : (trend === "up") === (goodWhen === "up")
        ? "good"
        : "bad"
  return { trend, sentiment, pct: change }
}

/**
 * The monthly stakeholder pack, rendered rather than reassembled by hand.
 *
 * Aggregated server-side: composing it from the daily endpoints and summing
 * would be subtly wrong, because those values are already rounded and
 * adding rounded numbers is how a monthly figure stops matching the
 * invoice.
 */
export function Report() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const [search, setSearch] = useSearchParams()
  const keyLabel = useKeyLabel()

  const requested = search.get("month")
  const month = requested && MONTH.test(requested) ? requested : currentMonth()

  const report = useMetricsReport(month)
  const data = report.data
  const previous = data?.previous ?? undefined

  const count = (value: number | null | undefined) => formatCount(value, language)
  const usd = (value: number | null | undefined) => formatUsd(value, language)
  const pct = (value: number | null | undefined) => formatPercent(value, language)

  const deltaProps = React.useCallback(
    (
      current: number | null,
      prior: number | null | undefined,
      goodWhen: "up" | "down"
    ) => {
      const result = delta(current, prior, goodWhen)
      if (!result) return {}
      return {
        delta: formatPercent(result.pct, language),
        deltaTrend: result.trend,
        deltaSentiment: result.sentiment,
        deltaLabel: t("admin.report.vsPrevious"),
      }
    },
    [language, t]
  )

  const histogram = React.useMemo(() => {
    const buckets = new Map<
      string,
      { bucket: string; bucket_order: number } & Record<string, number | string>
    >()
    for (const row of data?.efficacy.resolution_buckets ?? []) {
      const entry = buckets.get(row.bucket) ?? {
        bucket: row.bucket,
        bucket_order: row.bucket_order,
        critical: 0,
        warning: 0,
        info: 0,
      }
      entry[row.severity] = ((entry[row.severity] as number) ?? 0) + row.resolved_count
      buckets.set(row.bucket, entry)
    }
    return [...buckets.values()].sort((a, b) => a.bucket_order - b.bucket_order)
  }, [data])

  const severitySeries = [
    { key: "critical", label: keyLabel("severity", "critical") },
    { key: "warning", label: keyLabel("severity", "warning") },
    { key: "info", label: keyLabel("severity", "info") },
  ]

  const newestRate = React.useMemo(() => {
    const cards = data?.economics.rate_card ?? []
    return cards.reduce<(typeof cards)[number] | undefined>(
      (newest, card) =>
        !newest || card.effective_from > newest.effective_from ? card : newest,
      undefined
    )
  }, [data])

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 print:block">
        <div>
          <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
            {t("admin.report.title")}
          </h1>
          {data ? (
            <p className="text-sm text-ink-500">
              {formatDay(data.window.since, language)} –{" "}
              {formatDay(data.window.until ?? data.window.last_day, language)}
              {data.window.includes_partial_day
                ? ` · ${t("admin.report.monthInProgress")}`
                : ""}
            </p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-500 print:hidden">
          {t("admin.report.month")}
          <input
            type="month"
            value={month}
            onChange={(event) => {
              const next = event.target.value
              const updated = new URLSearchParams(search)
              if (MONTH.test(next)) updated.set("month", next)
              else updated.delete("month")
              setSearch(updated)
            }}
            className="h-8 rounded-md border border-line bg-background px-2 text-sm text-ink-700"
          />
        </label>
      </header>

      {report.isError ? (
        <PanelError error={report.error} onRetry={() => void report.refetch()} />
      ) : null}

      {report.isPending || !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
          ))}
        </div>
      ) : (
        <>
          <ReportSection title={t("admin.report.adoption")}>
            <StatTile
              label={t("admin.report.companiesTotal")}
              value={count(data.adoption.companies_total)}
              {...deltaProps(
                data.adoption.companies_total,
                previous?.adoption.companies_total,
                "up"
              )}
            />
            <StatTile
              label={t("admin.report.companiesActive")}
              value={count(data.adoption.companies_active)}
              {...deltaProps(
                data.adoption.companies_active,
                previous?.adoption.companies_active,
                "up"
              )}
            />
            <StatTile
              label={t("admin.report.signups")}
              value={count(data.adoption.signups)}
              {...deltaProps(data.adoption.signups, previous?.adoption.signups, "up")}
            />
            <StatTile
              label={t("admin.report.documentsProcessed")}
              value={count(data.engagement.documents_processed)}
              {...deltaProps(
                data.engagement.documents_processed,
                previous?.engagement.documents_processed,
                "up"
              )}
            />
          </ReportSection>

          <ReportSection title={t("admin.report.efficacy")}>
            <StatTile
              label={t("admin.report.findingsOpened")}
              value={count(data.efficacy.findings_opened)}
              {...deltaProps(
                data.efficacy.findings_opened,
                previous?.efficacy.findings_opened,
                "down"
              )}
            />
            <StatTile
              label={t("admin.report.findingsResolved")}
              value={count(data.efficacy.findings_resolved)}
              {...deltaProps(
                data.efficacy.findings_resolved,
                previous?.efficacy.findings_resolved,
                "up"
              )}
              caption={t("admin.report.resolvedSplit", {
                user: count(data.efficacy.resolved_by_user),
                system: count(data.efficacy.resolved_by_system),
              })}
            />
            <StatTile
              label={t("admin.report.successRate")}
              value={pct(data.reliability.success_pct)}
              caption={
                data.reliability.pipeline_runs === 0
                  ? t("admin.report.noRuns")
                  : undefined
              }
              {...deltaProps(
                data.reliability.success_pct,
                previous?.reliability.success_pct,
                "up"
              )}
            />
            <StatTile
              label={t("admin.report.errors")}
              value={count(data.reliability.errors)}
              {...deltaProps(
                data.reliability.errors,
                previous?.reliability.errors,
                "down"
              )}
            />
          </ReportSection>

          <ReportSection title={t("admin.report.economics")}>
            <StatTile
              label={t("admin.report.spend")}
              value={usd(data.economics.cost_usd)}
              caption={
                data.economics.unpriced_calls > 0
                  ? t("admin.report.unpriced", {
                      count: data.economics.unpriced_calls,
                    })
                  : undefined
              }
              {...deltaProps(
                data.economics.cost_usd,
                previous?.economics.cost_usd,
                "down"
              )}
            />
            <StatTile
              label={t("admin.report.wasted")}
              value={usd(data.economics.wasted_usd)}
              {...deltaProps(
                data.economics.wasted_usd,
                previous?.economics.wasted_usd,
                "down"
              )}
            />
            <StatTile
              label={t("admin.report.calls")}
              value={count(data.economics.calls)}
            />
            <StatTile
              label={t("admin.report.costPerCompany")}
              value={usd(
                data.economics.cost_usd !== null && data.adoption.companies_active > 0
                  ? data.economics.cost_usd / data.adoption.companies_active
                  : null
              )}
            />
          </ReportSection>

          <Panel
            title={t("admin.efficacy.histogramTitle")}
            caption={t("admin.efficacy.histogramCaption")}
            isEmpty={histogram.length === 0}
            table={
              <SeriesTable
                data={histogram}
                rowKey="bucket"
                rowLabel={t("admin.efficacy.bucket")}
                rowFormat={(value) => keyLabel("resolutionBucket", value)}
                series={severitySeries}
                valueFormat={count}
              />
            }
          >
            <StackedBars
              data={histogram}
              xKey="bucket"
              series={severitySeries}
              valueFormat={count}
              labelFormat={(value) => keyLabel("resolutionBucket", value)}
              colors={[
                STATUS_COLORS.danger,
                STATUS_COLORS.attention,
                STATUS_COLORS.neutral,
              ]}
              ariaLabel={t("admin.efficacy.histogramTitle")}
            />
          </Panel>

          {newestRate ? (
            <p className="text-[12px] text-ink-400">
              {t("admin.costs.rateSource", {
                date: formatDay(newestRate.effective_from, language),
                source: newestRate.source,
                model: newestRate.model,
              })}
            </p>
          ) : null}

          {previous === undefined ? (
            <p className="text-[12px] text-ink-400">
              {t("admin.report.noPrevious")}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function ReportSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h2 className="font-mono text-[11px] font-medium tracking-wide text-ink-400 uppercase">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  )
}

