import * as React from "react"
import { useTranslation } from "react-i18next"

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

function filterToStatusParam(filter: FilterValue): string | undefined {
  if (filter === "attention") return "running,error"
  if (filter === "all") return undefined
  return filter
}

export function JobsList() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = React.useState<FilterValue>("attention")
  const jobs = useJobsList(filterToStatusParam(filter))
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

      <SegmentedControl
        value={filter}
        onChange={(value) => {
          setFilter(value)
          setRetryResult(null)
        }}
        options={[
          { value: "attention", label: t("jobs.list.filterAttention") },
          { value: "all", label: t("jobs.list.filterAll") },
          { value: "pending", label: t("enums.jobStatus.pending") },
          { value: "running", label: t("enums.jobStatus.running") },
          { value: "done", label: t("enums.jobStatus.done") },
          { value: "error", label: t("enums.jobStatus.error") },
        ]}
      />

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
