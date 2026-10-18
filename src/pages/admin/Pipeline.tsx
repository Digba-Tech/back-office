import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { CategoryBars } from "@/components/charts/category-bars"
import { SeriesTable } from "@/components/charts/series-table"
import { StackedBars } from "@/components/charts/stacked-bars"
import { STATUS_COLORS } from "@/components/charts/theme"
import { TimeSeries } from "@/components/charts/time-series"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount, formatDay, formatDuration, formatPercent } from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useMetricsPipeline } from "./queries"
import type { PipelineDaily } from "./types"
import { WindowPicker } from "./WindowPicker"
import { useMetricsWindow } from "./window"

/**
 * A rate over a window is successes ÷ runs across the whole window — never
 * the mean of each day's percentage, which silently weights a Sunday with
 * three runs the same as a Tuesday with three thousand.
 */
function weightedPct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return (numerator / denominator) * 100
}

function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0)
}

/** Groups rows by a key, summing the numeric fields named in `fields`. */
function rollUp<T extends Record<string, unknown>>(
  rows: T[],
  groupKey: keyof T & string,
  fields: (keyof T & string)[]
): Record<string, number | string>[] {
  const groups = new Map<string, Record<string, number | string>>()
  for (const row of rows) {
    const key = String(row[groupKey])
    let group = groups.get(key)
    if (!group) {
      group = { [groupKey]: key }
      for (const field of fields) group[field] = 0
      groups.set(key, group)
    }
    for (const field of fields) {
      const value = row[field]
      if (typeof value === "number") {
        group[field] = (group[field] as number) + value
      }
    }
  }
  return [...groups.values()]
}

/**
 * Into the live queue, filtered to this job type's failures. The backend
 * validates `job_type` against its registry and 400s an unknown one, so
 * only values that came from the API itself are ever sent.
 */
function queueHref(jobType: string, day?: string): string {
  const params = new URLSearchParams({ job_type: jobType, status: "error" })
  // `since` filters on updated_at, so a day bucket becomes that day's
  // midnight. URLSearchParams encodes it; an unencoded "+00:00" would
  // arrive as a space and 422.
  if (day) params.set("since", `${day.slice(0, 10)}T00:00:00Z`)
  return `/admin/queue?${params.toString()}`
}

/** A day's failures, any job type. */
function dayQueueHref(day: string): string {
  const params = new URLSearchParams({
    status: "error",
    since: `${day.slice(0, 10)}T00:00:00Z`,
  })
  return `/admin/queue?${params.toString()}`
}

export function Pipeline() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const language = i18n.language
  const { params, setWindow } = useMetricsWindow()
  const pipeline = useMetricsPipeline(params)
  const keyLabel = useKeyLabel()

  const data = pipeline.data
  const count = (value: number | null | undefined) => formatCount(value, language)
  const pct = (value: number | null | undefined) => formatPercent(value, language)
  const ms = (value: number | null | undefined) => formatDuration(value, language)
  const day = (value: string) => formatDay(value, language)

  const daily = React.useMemo(() => data?.daily ?? [], [data])
  const jobs = React.useMemo(() => data?.jobs ?? [], [data])
  const latency = React.useMemo(() => data?.latency ?? [], [data])

  const totals = React.useMemo(
    () => ({
      runs: sumBy(daily, (row: PipelineDaily) => row.runs),
      successes: sumBy(daily, (row: PipelineDaily) => row.successes),
      errors: sumBy(daily, (row: PipelineDaily) => row.errors),
      analyses: sumBy(latency, (row) => row.analyses),
    }),
    [daily, latency]
  )

  // Worst first: the actionable order for a reliability page is the step
  // that is failing, not the alphabet.
  const byStep = React.useMemo(() => {
    const rolled = rollUp(daily, "step", ["runs", "successes", "errors", "skipped"])
    return rolled
      .map((row) => ({
        step: row.step as string,
        runs: row.runs as number,
        success_pct: weightedPct(row.successes as number, row.runs as number),
      }))
      .sort((a, b) => (a.success_pct ?? 101) - (b.success_pct ?? 101))
  }, [daily])

  const outcomesByDay = React.useMemo(
    () =>
      rollUp(daily, "day", ["successes", "errors", "skipped"]).sort((a, b) =>
        String(a.day).localeCompare(String(b.day))
      ),
    [daily]
  )

  const attemptsByDay = React.useMemo(
    () =>
      rollUp(jobs, "day", ["succeeded", "failed", "released", "still_running"]).sort(
        (a, b) => String(a.day).localeCompare(String(b.day))
      ),
    [jobs]
  )

  const byJobType = React.useMemo(() => {
    const rolled = rollUp(jobs, "job_type", ["attempts", "succeeded"])
    return rolled
      .map((row) => ({
        job_type: row.job_type as string,
        success_pct: weightedPct(row.succeeded as number, row.attempts as number),
      }))
      .sort((a, b) => (a.success_pct ?? 101) - (b.success_pct ?? 101))
  }, [jobs])

  const outcomeSeries = [
    { key: "successes", label: t("admin.pipeline.succeeded") },
    { key: "errors", label: t("admin.pipeline.failed") },
    { key: "skipped", label: t("admin.pipeline.skipped") },
  ]

  const attemptSeries = [
    { key: "succeeded", label: t("admin.pipeline.succeeded") },
    { key: "failed", label: t("admin.pipeline.failed") },
    { key: "released", label: t("admin.pipeline.released") },
    { key: "still_running", label: t("admin.pipeline.stillRunning") },
  ]

  const latencySeries = [
    { key: "p50_worked_ms", label: t("admin.pipeline.p50") },
    { key: "p95_worked_ms", label: t("admin.pipeline.p95") },
  ]

  // Guarded on `window` itself, not just on `data`: the contract says every
  // response carries one, but a response that omits it must degrade to "no
  // partial-day marker" rather than taking the whole page down.
  const partialNote = data?.window?.includes_partial_day
    ? t("admin.window.partialDay")
    : undefined

  const retry = () => void pipeline.refetch()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {t("admin.pipeline.title")}
        </h1>
        <WindowPicker params={params} onChange={setWindow} window={data?.window} />
      </header>

      {pipeline.isError ? (
        <PanelError error={pipeline.error} onRetry={retry} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pipeline.isPending || !data ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
          ))
        ) : (
          <>
            <StatTile label={t("admin.pipeline.runs")} value={count(totals.runs)} />
            <StatTile
              label={t("admin.pipeline.successRate")}
              value={pct(weightedPct(totals.successes, totals.runs))}
              caption={totals.runs === 0 ? t("admin.pipeline.noRuns") : undefined}
            />
            <StatTile label={t("admin.pipeline.errors")} value={count(totals.errors)} />
            <StatTile
              label={t("admin.pipeline.analyses")}
              value={count(totals.analyses)}
            />
          </>
        )}
      </div>

      <Panel
        title={t("admin.pipeline.stepSuccessTitle")}
        caption={t("admin.pipeline.stepSuccessCaption")}
        isLoading={pipeline.isPending}
        isEmpty={byStep.length === 0}
        error={pipeline.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={byStep}
            rowKey="step"
            rowLabel={t("admin.pipeline.step")}
            rowFormat={(value) => keyLabel("pipelineStep", value)}
            series={[
              { key: "success_pct", label: t("admin.pipeline.successRate") },
              { key: "runs", label: t("admin.pipeline.runs") },
            ]}
            valueFormat={count}
          />
        }
      >
        <CategoryBars
          data={byStep}
          categoryKey="step"
          valueKey="success_pct"
          label={t("admin.pipeline.successRate")}
          valueFormat={pct}
          categoryFormat={(value) => keyLabel("pipelineStep", value)}
          ariaLabel={t("admin.pipeline.stepSuccessTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.pipeline.outcomesTitle")}
        caption={partialNote}
        isLoading={pipeline.isPending}
        isEmpty={outcomesByDay.length === 0}
        error={pipeline.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={outcomesByDay}
            rowKey="day"
            rowLabel={t("admin.pipeline.day")}
            rowFormat={day}
            series={outcomeSeries}
            valueFormat={count}
          />
        }
      >
        <StackedBars
          data={outcomesByDay}
          xKey="day"
          series={outcomeSeries}
          window={data?.window}
          valueFormat={count}
          labelFormat={day}
          colors={[STATUS_COLORS.good, STATUS_COLORS.danger, STATUS_COLORS.neutral]}
          ariaLabel={t("admin.pipeline.outcomesTitle")}
        />
      </Panel>

      {/* Latency is its own chart rather than a second axis on the one
          above: volume and duration share nothing but a date. */}
      <Panel
        title={t("admin.pipeline.latencyTitle")}
        caption={partialNote}
        isLoading={pipeline.isPending}
        isEmpty={latency.length === 0}
        error={pipeline.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={latency}
            rowKey="day"
            rowLabel={t("admin.pipeline.day")}
            rowFormat={day}
            series={latencySeries}
            valueFormat={ms}
          />
        }
      >
        <TimeSeries
          data={latency}
          xKey="day"
          series={latencySeries}
          window={data?.window}
          valueFormat={ms}
          labelFormat={day}
          ariaLabel={t("admin.pipeline.latencyTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.pipeline.attemptsTitle")}
        caption={t("admin.pipeline.attemptsCaption")}
        isLoading={pipeline.isPending}
        isEmpty={attemptsByDay.length === 0}
        error={pipeline.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={attemptsByDay}
            rowKey="day"
            rowLabel={t("admin.pipeline.day")}
            rowFormat={day}
            series={attemptSeries}
            valueFormat={count}
            rowHref={(row) => dayQueueHref(String(row.day))}
          />
        }
      >
        <StackedBars
          data={attemptsByDay}
          xKey="day"
          series={attemptSeries}
          window={data?.window}
          valueFormat={count}
          labelFormat={day}
          onCategorySelect={(bucket) => navigate(dayQueueHref(bucket))}
          colors={[
            STATUS_COLORS.good,
            STATUS_COLORS.danger,
            STATUS_COLORS.attention,
            STATUS_COLORS.neutral,
          ]}
          ariaLabel={t("admin.pipeline.attemptsTitle")}
        />
      </Panel>

      {/* Drilling down lands on the live queue filtered to that type's
          failures — "this type fails a lot" is only actionable if you can
          then see which jobs, and retry them. */}
      <Panel
        title={t("admin.pipeline.jobTypeTitle")}
        caption={t("admin.pipeline.jobTypeCaption")}
        isLoading={pipeline.isPending}
        isEmpty={byJobType.length === 0}
        error={pipeline.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={byJobType}
            rowKey="job_type"
            rowLabel={t("admin.pipeline.jobType")}
            rowFormat={(value) => keyLabel("jobType", value)}
            series={[{ key: "success_pct", label: t("admin.pipeline.successRate") }]}
            valueFormat={pct}
            rowHref={(row) => queueHref(String(row.job_type))}
          />
        }
      >
        <CategoryBars
          data={byJobType}
          categoryKey="job_type"
          valueKey="success_pct"
          label={t("admin.pipeline.successRate")}
          valueFormat={pct}
          categoryFormat={(value) => keyLabel("jobType", value)}
          colorIndex={1}
          onCategorySelect={(jobType) => navigate(queueHref(jobType))}
          ariaLabel={t("admin.pipeline.jobTypeTitle")}
        />
      </Panel>
    </div>
  )
}
