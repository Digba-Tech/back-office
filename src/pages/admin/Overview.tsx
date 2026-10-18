import * as React from "react"
import { useTranslation } from "react-i18next"

import { CategoryBars } from "@/components/charts/category-bars"
import { SeriesTable } from "@/components/charts/series-table"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount, formatPercent, formatUsd } from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useMetricsOverview } from "./queries"
import { WindowPicker } from "./WindowPicker"
import { useMetricsWindow } from "./window"

export function Overview() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { params, setWindow } = useMetricsWindow()
  const overview = useMetricsOverview(params)
  const keyLabel = useKeyLabel()

  const data = overview.data
  const count = (value: number | null | undefined) => formatCount(value, language)

  // Monotonic by contract, but the order is the backend's, not the array's.
  const funnel = [...(data?.funnel ?? [])].sort((a, b) => a.step_order - b.step_order)
  const funnelStepLabel = (step: string) => keyLabel("funnelStep", step)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {t("admin.overview.title")}
        </h1>
        <WindowPicker params={params} onChange={setWindow} window={data?.window} />
      </header>

      {overview.isError ? (
        <PanelError error={overview.error} onRetry={() => void overview.refetch()} />
      ) : null}

      <Section title={t("admin.overview.sectionCustomers")}>
        {overview.isPending || !data ? (
          <TileSkeletons count={4} />
        ) : (
          <>
            <StatTile label={t("admin.overview.total")} value={count(data.customers.total)} />
            <StatTile
              label={t("admin.overview.active")}
              value={count(data.customers.active)}
            />
            <StatTile
              label={t("admin.overview.dormant")}
              value={count(data.customers.dormant)}
            />
            <StatTile
              label={t("admin.overview.withOpenCriticals")}
              value={count(data.customers.with_open_criticals)}
            />
          </>
        )}
      </Section>

      <Section title={t("admin.overview.sectionReliability")}>
        {overview.isPending || !data ? (
          <TileSkeletons count={3} />
        ) : (
          <>
            <StatTile
              label={t("admin.overview.pipelineRuns")}
              value={count(data.reliability.pipeline_runs)}
            />
            {/* success_pct is null when nothing ran. Rendering that as 0%
                would read as a total outage on a quiet weekend. */}
            <StatTile
              label={t("admin.overview.successRate")}
              value={formatPercent(data.reliability.success_pct, language)}
              caption={
                data.reliability.success_pct === null
                  ? t("admin.overview.noRuns")
                  : undefined
              }
            />
            <StatTile
              label={t("admin.overview.errors")}
              value={count(data.reliability.errors)}
            />
          </>
        )}
      </Section>

      <Section title={t("admin.overview.sectionCost")}>
        {overview.isPending || !data ? (
          <TileSkeletons count={3} />
        ) : (
          <>
            <StatTile
              label={t("admin.overview.cost")}
              value={formatUsd(data.cost.usd, language)}
              caption={
                data.cost.unpriced_calls > 0
                  ? t("admin.overview.unpricedHint", { count: data.cost.unpriced_calls })
                  : undefined
              }
            />
            <StatTile
              label={t("admin.overview.wasted")}
              value={formatUsd(data.cost.wasted_usd, language)}
              caption={t("admin.overview.wastedHint")}
            />
            <StatTile label={t("admin.overview.calls")} value={count(data.cost.calls)} />
          </>
        )}
      </Section>

      <Section title={t("admin.overview.sectionOutcomes")}>
        {overview.isPending || !data ? (
          <TileSkeletons count={2} />
        ) : (
          <>
            <StatTile
              label={t("admin.overview.findingsOpened")}
              value={count(data.outcomes.findings_opened)}
            />
            {/* The split matters: a person waiving a finding and the system
                cascade closing it are different stories. */}
            <StatTile
              label={t("admin.overview.findingsResolved")}
              value={count(data.outcomes.findings_resolved)}
              caption={t("admin.overview.resolvedSplit", {
                user: count(data.outcomes.resolved_by_user),
                system: count(data.outcomes.resolved_by_system),
              })}
            />
          </>
        )}
      </Section>

      <Panel
        title={t("admin.overview.funnelTitle")}
        isLoading={overview.isPending}
        isEmpty={funnel.length === 0}
        error={overview.error ?? undefined}
        onRetry={() => void overview.refetch()}
        table={
          <SeriesTable
            data={funnel}
            rowKey="step"
            rowLabel={t("admin.overview.funnelStep")}
            rowFormat={funnelStepLabel}
            series={[{ key: "companies", label: t("admin.overview.funnelCompanies") }]}
            valueFormat={count}
          />
        }
      >
        {/* Horizontal bars with step labels — never a tapered 3-D funnel,
            whose widths encode nothing. */}
        <CategoryBars
          data={funnel}
          categoryKey="step"
          valueKey="companies"
          label={t("admin.overview.funnelCompanies")}
          valueFormat={count}
          categoryFormat={funnelStepLabel}
          ariaLabel={t("admin.overview.funnelTitle")}
        />
      </Panel>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[11px] font-medium tracking-wide text-ink-400 uppercase">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  )
}

function TileSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
      ))}
    </>
  )
}
