import * as React from "react"
import { useTranslation } from "react-i18next"

import { CategoryBars } from "@/components/charts/category-bars"
import { SeriesTable } from "@/components/charts/series-table"
import { StackedBars } from "@/components/charts/stacked-bars"
import { STATUS_COLORS } from "@/components/charts/theme"
import { TimeSeries } from "@/components/charts/time-series"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount, formatDay, formatHours } from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useMetricsEfficacy } from "./queries"
import { WindowPicker } from "./WindowPicker"
import { useMetricsWindow } from "./window"

export function Efficacy() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { params, setWindow } = useMetricsWindow()
  const efficacy = useMetricsEfficacy(params)
  const keyLabel = useKeyLabel()

  const data = efficacy.data
  const count = (value: number | null | undefined) => formatCount(value, language)
  const hours = (value: number | null | undefined) => formatHours(value, language)
  const day = (value: string) => formatDay(value, language)

  const outcomes = React.useMemo(() => data?.outcomes ?? [], [data])

  // Severity collapses here: the story on this chart is the gap between
  // the two lines, and splitting it six ways hides that.
  const openedVsResolved = React.useMemo(() => {
    const byDay = new Map<string, { day: string; opened: number; resolved: number }>()
    for (const row of outcomes) {
      const key = row.day.slice(0, 10)
      const entry = byDay.get(key) ?? { day: key, opened: 0, resolved: 0 }
      entry.opened += row.opened
      entry.resolved += row.resolved
      byDay.set(key, entry)
    }
    return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
  }, [outcomes])

  const totals = React.useMemo(() => {
    let opened = 0
    let resolved = 0
    let byUser = 0
    let bySystem = 0
    for (const row of outcomes) {
      opened += row.opened
      resolved += row.resolved
      byUser += row.resolved_by_user
      bySystem += row.resolved_by_system
    }
    return { opened, resolved, byUser, bySystem }
  }, [outcomes])

  const resolutionTimes = React.useMemo(
    () => [...(data?.resolution_times ?? [])],
    [data]
  )

  const evidence = React.useMemo(() => data?.evidence_quality ?? [], [data])
  const catalogue = React.useMemo(() => data?.catalogue ?? [], [data])

  // Already bucketed at source, so this is a genuine distribution rather
  // than a percentage dressed up as one.
  const confidenceSeries = [
    { key: "confidence_over_80", label: t("admin.efficacy.confidenceOver80") },
    { key: "confidence_50_to_80", label: t("admin.efficacy.confidence50to80") },
    { key: "confidence_under_50", label: t("admin.efficacy.confidenceUnder50") },
    { key: "confidence_missing", label: t("admin.efficacy.confidenceMissing") },
  ]

  const catalogueByStandard = React.useMemo(() => {
    const byStandard = new Map<string, Record<string, number | string>>()
    for (const row of catalogue) {
      const entry = byStandard.get(row.standard) ?? {
        standard: row.standard,
        draft: 0,
        active: 0,
        deprecated: 0,
      }
      entry[row.status] = ((entry[row.status] as number) ?? 0) + row.requirements
      byStandard.set(row.standard, entry)
    }
    return [...byStandard.values()]
  }, [catalogue])

  const catalogueSeries = [
    { key: "active", label: t("admin.efficacy.statusActive") },
    { key: "draft", label: t("admin.efficacy.statusDraft") },
    { key: "deprecated", label: t("admin.efficacy.statusDeprecated") },
  ]

  const outcomeSeries = [
    { key: "opened", label: t("admin.efficacy.opened") },
    { key: "resolved", label: t("admin.efficacy.resolved") },
  ]

  const retry = () => void efficacy.refetch()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {t("admin.efficacy.title")}
        </h1>
        <WindowPicker params={params} onChange={setWindow} window={data?.window} />
      </header>

      {efficacy.isError ? <PanelError error={efficacy.error} onRetry={retry} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {efficacy.isPending || !data ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
          ))
        ) : (
          <>
            <StatTile label={t("admin.efficacy.opened")} value={count(totals.opened)} />
            <StatTile
              label={t("admin.efficacy.resolved")}
              value={count(totals.resolved)}
            />
            <StatTile
              label={t("admin.efficacy.resolvedByUser")}
              value={count(totals.byUser)}
              caption={t("admin.efficacy.byUserHint")}
            />
            <StatTile
              label={t("admin.efficacy.resolvedBySystem")}
              value={count(totals.bySystem)}
              caption={t("admin.efficacy.bySystemHint")}
            />
          </>
        )}
      </div>

      <Panel
        title={t("admin.efficacy.outcomesTitle")}
        caption={t("admin.efficacy.outcomesCaption")}
        isLoading={efficacy.isPending}
        isEmpty={openedVsResolved.length === 0}
        error={efficacy.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={openedVsResolved}
            rowKey="day"
            rowLabel={t("admin.efficacy.day")}
            rowFormat={day}
            series={outcomeSeries}
            valueFormat={count}
          />
        }
      >
        <TimeSeries
          data={openedVsResolved}
          xKey="day"
          series={outcomeSeries}
          window={data?.window}
          valueFormat={count}
          labelFormat={day}
          ariaLabel={t("admin.efficacy.outcomesTitle")}
        />
      </Panel>

      {/* The guide asks for a histogram here, because a central tendency
          hides the bimodality that makes this number actionable. The
          endpoint exposes p50 and p90 per severity rather than bucketed
          counts, so percentiles are what can honestly be drawn — see the
          note raised with the backend. */}
      <Panel
        title={t("admin.efficacy.resolutionTitle")}
        caption={t("admin.efficacy.resolutionCaption")}
        isLoading={efficacy.isPending}
        isEmpty={resolutionTimes.length === 0}
        error={efficacy.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={resolutionTimes}
            rowKey="severity"
            rowLabel={t("admin.efficacy.severity")}
            rowFormat={(value) => keyLabel("severity", value)}
            series={[
              { key: "p50_hours", label: t("admin.efficacy.p50") },
              { key: "p90_hours", label: t("admin.efficacy.p90") },
            ]}
            valueFormat={hours}
          />
        }
      >
        <CategoryBars
          data={resolutionTimes}
          categoryKey="severity"
          valueKey="p50_hours"
          label={t("admin.efficacy.p50")}
          valueFormat={hours}
          categoryFormat={(value) => keyLabel("severity", value)}
          ariaLabel={t("admin.efficacy.resolutionTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.efficacy.confidenceTitle")}
        caption={t("admin.efficacy.confidenceCaption")}
        isLoading={efficacy.isPending}
        isEmpty={evidence.length === 0}
        error={efficacy.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={evidence}
            rowKey="standard"
            rowLabel={t("admin.efficacy.standard")}
            series={[
              ...confidenceSeries,
              { key: "verdicts", label: t("admin.efficacy.verdicts") },
            ]}
            valueFormat={count}
          />
        }
      >
        <StackedBars
          data={evidence}
          xKey="standard"
          series={confidenceSeries}
          valueFormat={count}
          ariaLabel={t("admin.efficacy.confidenceTitle")}
        />
      </Panel>

      <Panel
        title={t("admin.efficacy.catalogueTitle")}
        isLoading={efficacy.isPending}
        isEmpty={catalogueByStandard.length === 0}
        error={efficacy.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={catalogueByStandard}
            rowKey="standard"
            rowLabel={t("admin.efficacy.standard")}
            series={catalogueSeries}
            valueFormat={count}
          />
        }
      >
        <StackedBars
          data={catalogueByStandard}
          xKey="standard"
          series={catalogueSeries}
          valueFormat={count}
          colors={[STATUS_COLORS.good, STATUS_COLORS.attention, STATUS_COLORS.neutral]}
          ariaLabel={t("admin.efficacy.catalogueTitle")}
        />
      </Panel>
    </div>
  )
}
