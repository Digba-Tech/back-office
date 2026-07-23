import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { SegmentedControl } from "@/components/segmented-control"
import { ActiveStatusBadge, SourceTypeBadge } from "@/components/status-badge"
import { StatTile } from "@/components/stat-tile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/format"
import type { SourceType } from "@/lib/types"

import { useSourcesList, useSourcesMonitoring, useSourcesVocabulary } from "./queries"

export function SourcesList() {
  const { t, i18n } = useTranslation()
  const [active, setActive] = React.useState<string>("all")
  const [standard, setStandard] = React.useState("")
  const [sourceType, setSourceType] = React.useState<string>("all")

  const vocabulary = useSourcesVocabulary()
  const monitoring = useSourcesMonitoring()
  const sources = useSourcesList({
    active: active === "all" ? undefined : active,
    standard: standard || undefined,
    source_type: sourceType === "all" ? undefined : sourceType,
  })

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">{t("sources.list.title")}</h1>
        <Button asChild>
          <Link to="/sources/new">{t("sources.list.newSource")}</Link>
        </Button>
      </div>

      {monitoring.data && (
        <div className="grid grid-cols-3 gap-4">
          <StatTile label={t("sources.list.statTotal")} value={monitoring.data.total} />
          <StatTile
            label={t("sources.list.statActive")}
            value={monitoring.data.active}
            tone="positive"
          />
          <StatTile
            label={t("sources.list.statInactive")}
            value={monitoring.data.inactive}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          value={active}
          onChange={setActive}
          options={[
            { value: "all", label: t("sources.list.filterAllStatuses") },
            { value: "true", label: t("sources.list.filterActiveOnly") },
            { value: "false", label: t("sources.list.filterInactiveOnly") },
          ]}
        />

        <SegmentedControl
          value={sourceType}
          onChange={setSourceType}
          options={[
            { value: "all", label: t("sources.list.filterAllTypes") },
            ...(vocabulary.data?.source_types.map((type) => ({
              value: type as string,
              label: t(`enums.sourceType.${type}`),
            })) ?? []),
          ]}
        />

        <Input
          placeholder={t("sources.list.filterStandardPlaceholder")}
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="w-56"
        />
      </div>

      {sources.isLoading && <Skeleton className="h-40 w-full" />}

      {sources.error && (
        <p className="text-destructive text-sm">
          {t("sources.list.loadFailed", { message: sources.error.message })}
        </p>
      )}

      {sources.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sources.list.colName")}</TableHead>
              <TableHead>{t("sources.list.colType")}</TableHead>
              <TableHead>{t("sources.list.colStatus")}</TableHead>
              <TableHead>{t("sources.list.colLastScraped")}</TableHead>
              <TableHead>{t("sources.list.colError")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.data.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <Link
                    to={`/sources/${source.id}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {source.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <SourceTypeBadge type={source.source_type as SourceType} />
                </TableCell>
                <TableCell>
                  <ActiveStatusBadge active={source.is_active} />
                </TableCell>
                <TableCell className="font-mono text-sm text-ink-500">
                  {source.last_scraped_at
                    ? formatDateTime(source.last_scraped_at, i18n.language)
                    : t("sources.list.never")}
                </TableCell>
                <TableCell>
                  {source.last_scrape_error && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-5 w-fit cursor-default items-center rounded-full bg-danger-tint px-2 text-[11px] font-semibold whitespace-nowrap text-destructive uppercase">
                          {t("sources.list.errorBadge")}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{source.last_scrape_error}</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sources.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-ink-500">
                  {t("sources.list.emptyFiltered")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
