import * as React from "react"
import { useTranslation } from "react-i18next"

import { SeriesTable } from "@/components/charts/series-table"
import { TimeSeries } from "@/components/charts/time-series"
import { Panel, PanelError } from "@/components/panel"
import { StatTile } from "@/components/stat-tile"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NO_VALUE, formatCount, formatDay, formatDateTime } from "@/lib/format"

import { useMetricsUsage } from "./queries"
import type { CompanyUsage } from "./types"
import { WindowPicker } from "./WindowPicker"
import { useMetricsWindow } from "./window"

/**
 * The customer list, driven by /admin/metrics/usage.
 *
 * Deliberately NOT /admin/customers: that family writes an immutable audit
 * row per call, and a list view that anyone leaves open would bury the
 * entries that record a real human opening a real customer's data.
 * `companies[]` carries the names and counts this page needs and no tenant
 * content at all, so it is the right source (metrics guide §2).
 */
export function Customers() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { params, setWindow } = useMetricsWindow()
  const usage = useMetricsUsage(params)

  const data = usage.data
  const count = (value: number | null | undefined) => formatCount(value, language)
  const day = (value: string) => formatDay(value, language)

  const companies = React.useMemo(
    () =>
      [...(data?.companies ?? [])].sort((a, b) =>
        a.company_name.localeCompare(b.company_name, language)
      ),
    [data, language]
  )

  const totals = React.useMemo(
    () => ({
      total: companies.length,
      dormant: companies.filter((row) => row.is_dormant_30d).length,
      withCriticals: companies.filter((row) => row.findings_open_critical > 0).length,
      inFlight: companies.reduce((sum, row) => sum + row.documents_in_flight, 0),
    }),
    [companies]
  )

  // Acquisition is signups and active users only. backfilled_accounts are
  // users imported from before the lifecycle table existed — their first
  // sighting is an observation date, not a signup, and charting them would
  // show a spike that never happened. They stay in the table.
  const signupSeries = [
    { key: "signups", label: t("admin.customers.signups") },
    { key: "active_users", label: t("admin.customers.activeUsers") },
  ]

  const retry = () => void usage.refetch()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {t("admin.customers.title")}
        </h1>
        <WindowPicker params={params} onChange={setWindow} window={data?.window} />
      </header>

      {usage.isError ? <PanelError error={usage.error} onRetry={retry} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {usage.isPending || !data ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] w-full rounded-[10px]" />
          ))
        ) : (
          <>
            <StatTile
              label={t("admin.customers.total")}
              value={count(totals.total)}
            />
            <StatTile
              label={t("admin.customers.dormant")}
              value={count(totals.dormant)}
              caption={t("admin.customers.dormantHint")}
            />
            <StatTile
              label={t("admin.customers.withCriticals")}
              value={count(totals.withCriticals)}
            />
            <StatTile
              label={t("admin.customers.inFlight")}
              value={count(totals.inFlight)}
            />
          </>
        )}
      </div>

      <Panel
        title={t("admin.customers.signupsTitle")}
        caption={t("admin.customers.backfillHint")}
        isLoading={usage.isPending}
        isEmpty={(data?.signups.length ?? 0) === 0}
        error={usage.error ?? undefined}
        onRetry={retry}
        table={
          <SeriesTable
            data={data?.signups ?? []}
            rowKey="day"
            rowLabel={t("admin.customers.day")}
            rowFormat={day}
            series={[
              ...signupSeries,
              { key: "verified", label: t("admin.customers.verified") },
              { key: "backfilled_accounts", label: t("admin.customers.backfilled") },
            ]}
            valueFormat={count}
          />
        }
      >
        <TimeSeries
          data={data?.signups ?? []}
          xKey="day"
          series={signupSeries}
          window={data?.window}
          valueFormat={count}
          labelFormat={day}
          ariaLabel={t("admin.customers.signupsTitle")}
        />
      </Panel>

      <section className="rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]">
        <h2 className="mb-4 font-heading text-[17px] leading-tight font-semibold text-navy">
          {t("admin.customers.tableTitle")}
        </h2>
        {usage.isPending ? (
          <Skeleton className="h-[220px] w-full" />
        ) : companies.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-500">
            {t("admin.panel.empty")}
          </p>
        ) : (
          <CompaniesTable companies={companies} language={language} />
        )}
      </section>
    </div>
  )
}

function CompaniesTable({
  companies,
  language,
}: {
  companies: CompanyUsage[]
  language: string
}) {
  const { t } = useTranslation()
  const count = (value: number | null | undefined) => formatCount(value, language)

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.customers.company")}</TableHead>
            <TableHead className="text-right">
              {t("admin.customers.documents")}
            </TableHead>
            <TableHead className="text-right">{t("admin.customers.errors")}</TableHead>
            <TableHead className="text-right">
              {t("admin.customers.openFindings")}
            </TableHead>
            <TableHead className="text-right">
              {t("admin.customers.criticals")}
            </TableHead>
            <TableHead>{t("admin.customers.lastActivity")}</TableHead>
            <TableHead>{t("admin.customers.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.company_id}>
              <TableCell className="font-medium">{company.company_name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {t("admin.customers.documentsRatio", {
                  done: count(company.documents_done),
                  total: count(company.documents_total),
                })}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {count(company.documents_error)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {count(company.findings_open)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {company.findings_open_critical > 0 ? (
                  <Badge variant="destructive">
                    {count(company.findings_open_critical)}
                  </Badge>
                ) : (
                  count(company.findings_open_critical)
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-ink-500">
                {company.last_activity_at
                  ? formatDateTime(company.last_activity_at, language)
                  : NO_VALUE}
              </TableCell>
              <TableCell>
                <Badge variant={company.is_dormant_30d ? "outline" : "default"}>
                  {company.is_dormant_30d
                    ? t("admin.customers.statusDormant")
                    : t("admin.customers.statusActive")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
