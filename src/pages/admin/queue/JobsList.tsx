import * as React from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { SegmentedControl } from "@/components/segmented-control"
import { JobStatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
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
import type { Job } from "@/lib/types"

import { useJobsList, useRetryJob } from "./queries"

// A job stuck "running" this long (backend's own self-heal window is 15
// minutes, guide §4.3) is worth flagging as "looks stuck" rather than
// silently trusting it's still making progress.
const STUCK_AFTER_MS = 5 * 60 * 1000

type FilterValue = "attention" | "all" | "pending" | "running" | "done" | "error"

const FILTER_VALUES: FilterValue[] = [
  "attention",
  "all",
  "pending",
  "running",
  "done",
  "error",
]

function filterToStatusParam(filter: FilterValue): string | undefined {
  if (filter === "attention") return "running,error"
  if (filter === "all") return undefined
  return filter
}

// The registry the backend validates against. An unknown job_type is a 400
// rather than an empty list — deliberately, since a typo and a type with no
// jobs look identical otherwise — so a hand-edited URL is dropped here
// instead of turning the page into an error.
const JOB_TYPES = [
  "ingest_document",
  "analyze_company",
  "ingest_source",
  "extract_requirements",
  "gap_sweep",
  "backfill_requirement_i18n",
  "snapshot_readiness",
] as const

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/

export function JobsList() {
  const { t, i18n } = useTranslation()

  // Filters live in the URL so the pipeline pages can link straight to a
  // filtered queue — "these are the attempts that failed on Tuesday" is
  // only useful if it lands somewhere, and it makes the view shareable.
  const [search, setSearch] = useSearchParams()

  const statusParam = search.get("status")
  const filter: FilterValue = FILTER_VALUES.includes(statusParam as FilterValue)
    ? (statusParam as FilterValue)
    : "attention"

  const jobTypeParam = search.get("job_type")
  const jobType = JOB_TYPES.includes(jobTypeParam as (typeof JOB_TYPES)[number])
    ? (jobTypeParam as string)
    : undefined

  const sinceParam = search.get("since")
  const since = sinceParam && ISO_DATETIME.test(sinceParam) ? sinceParam : undefined

  function setParam(key: string, value: string | undefined) {
    const updated = new URLSearchParams(search)
    if (value) updated.set(key, value)
    else updated.delete(key)
    setSearch(updated)
    setRetryResult(null)
  }

  const jobs = useJobsList({
    status_filter: filterToStatusParam(filter),
    job_type: jobType,
    since,
  })
  const retryJob = useRetryJob()
  const [retryingId, setRetryingId] = React.useState<string | null>(null)
  // Retrying moves a job to "pending", which drops out of the default
  // "needs attention" (running/error) filter the instant it succeeds — this
  // is what's supposed to happen, but a row silently vanishing looks like a
  // bug rather than "queued for another attempt," so a confirmation banner
  // says so explicitly.
  const [retryResult, setRetryResult] = React.useState<
    { ok: true } | { ok: false; message: string } | null
  >(null)

  function onRetry(id: string) {
    setRetryingId(id)
    setRetryResult(null)
    retryJob.mutate(id, {
      onSuccess: () => setRetryResult({ ok: true }),
      onError: (err) => setRetryResult({ ok: false, message: err.message }),
      onSettled: () => setRetryingId(null),
    })
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-navy">{t("jobs.list.title")}</h1>
      </div>

      {retryResult && (
        <p className={retryResult.ok ? "text-sm text-ink-500" : "text-destructive text-sm"}>
          {retryResult.ok
            ? t("jobs.list.retrySuccess")
            : t("jobs.list.retryFailed", { message: retryResult.message })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          value={filter}
          onChange={(value) => setParam("status", value === "attention" ? undefined : value)}
          options={[
            { value: "attention", label: t("jobs.list.filterAttention") },
            { value: "all", label: t("jobs.list.filterAll") },
            { value: "pending", label: t("enums.jobStatus.pending") },
            { value: "running", label: t("enums.jobStatus.running") },
            { value: "done", label: t("enums.jobStatus.done") },
            { value: "error", label: t("enums.jobStatus.error") },
          ]}
        />

        <label className="flex items-center gap-2 text-sm text-ink-500">
          {t("jobs.list.filterType")}
          <select
            value={jobType ?? ""}
            onChange={(event) => setParam("job_type", event.target.value || undefined)}
            className="h-7 rounded-md border border-line bg-background px-2 text-sm text-ink-700"
          >
            <option value="">{t("jobs.list.allTypes")}</option>
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`enums.jobType.${type}`, { defaultValue: type })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Arriving from a pipeline drill-down narrows to a day. Saying so
          matters: an empty queue under a silent `since` reads as "nothing
          is queued" when it means "nothing since Tuesday". */}
      {since ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
          {t("jobs.list.sinceFilter", {
            when: formatDateTime(since, i18n.language),
          })}
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setParam("since", undefined)}
          >
            {t("jobs.list.clearSince")}
          </Button>
        </p>
      ) : null}

      {jobs.isLoading && <Skeleton className="h-40 w-full" />}

      {jobs.error && (
        <p className="text-destructive text-sm">
          {t("jobs.list.loadFailed", { message: jobs.error.message })}
        </p>
      )}

      {jobs.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("jobs.list.colType")}</TableHead>
              <TableHead>{t("jobs.list.colStatus")}</TableHead>
              <TableHead>{t("jobs.list.colAttempts")}</TableHead>
              <TableHead>{t("jobs.list.colUpdated")}</TableHead>
              <TableHead>{t("jobs.list.colError")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.data.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                language={i18n.language}
                retrying={retryingId === job.id && retryJob.isPending}
                onRetry={() => onRetry(job.id)}
              />
            ))}
            {jobs.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-ink-500">
                  {t("jobs.list.emptyFiltered")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function JobRow({
  job,
  language,
  retrying,
  onRetry,
}: {
  job: Job
  language: string
  retrying: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const looksStuck =
    job.status === "running" &&
    Date.now() - new Date(job.updated_at).getTime() > STUCK_AFTER_MS

  return (
    <TableRow>
      <TableCell className="font-medium text-navy">
        {t(`enums.jobType.${job.type}`, { defaultValue: job.type })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <JobStatusBadge status={job.status} />
          {looksStuck && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-5 w-fit cursor-default items-center rounded-full bg-danger-tint px-2 text-[11px] font-semibold whitespace-nowrap text-destructive uppercase">
                  {t("jobs.list.stuckBadge")}
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("jobs.list.stuckInfo")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-ink-500">
        {job.attempts} / {job.max_attempts}
      </TableCell>
      <TableCell className="font-mono text-sm text-ink-500">
        {formatDateTime(job.updated_at, language)}
      </TableCell>
      <TableCell>
        {job.last_error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex h-5 w-fit cursor-default items-center rounded-full bg-danger-tint px-2 text-[11px] font-semibold whitespace-nowrap text-destructive uppercase">
                {t("jobs.list.errorBadge")}
              </span>
            </TooltipTrigger>
            <TooltipContent>{job.last_error}</TooltipContent>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        {job.status !== "done" && (
          <Button
            variant="outline"
            size="sm"
            disabled={retrying}
            onClick={onRetry}
            className="cursor-pointer"
          >
            {retrying ? t("jobs.list.retrying") : t("jobs.list.retry")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
