import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/format"

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
        <h1 className="text-xl font-semibold">{t("sources.list.title")}</h1>
        <Button asChild>
          <Link to="/sources/new">{t("sources.list.newSource")}</Link>
        </Button>
      </div>

      {monitoring.data && (
        <div className="grid grid-cols-3 gap-4">
          <MonitoringStat label={t("sources.list.statTotal")} value={monitoring.data.total} />
          <MonitoringStat label={t("sources.list.statActive")} value={monitoring.data.active} />
          <MonitoringStat
            label={t("sources.list.statInactive")}
            value={monitoring.data.inactive}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={active} onValueChange={setActive}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sources.list.filterAllStatuses")}</SelectItem>
            <SelectItem value="true">{t("sources.list.filterActiveOnly")}</SelectItem>
            <SelectItem value="false">{t("sources.list.filterInactiveOnly")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sources.list.filterAllTypes")}</SelectItem>
            {vocabulary.data?.source_types.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`enums.sourceType.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                    className="font-medium hover:underline"
                  >
                    {source.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`enums.sourceType.${source.source_type}`)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={source.is_active ? "default" : "secondary"}>
                    {source.is_active
                      ? t("sources.list.statActive")
                      : t("sources.list.statInactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {source.last_scraped_at
                    ? formatDateTime(source.last_scraped_at, i18n.language)
                    : t("sources.list.never")}
                </TableCell>
                <TableCell>
                  {source.last_scrape_error && (
                    <Badge variant="destructive" title={source.last_scrape_error}>
                      {t("sources.list.errorBadge")}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sources.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
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

function MonitoringStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
