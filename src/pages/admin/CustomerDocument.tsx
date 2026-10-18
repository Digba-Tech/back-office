import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { PanelError } from "@/components/panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { NO_VALUE, formatDateTime, formatDuration } from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useDocumentProcessing } from "./queries"
import type { ProcessingStep } from "./types"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The per-step history that answers "why did this customer's analysis
 * fail" — previously only visible in server logs.
 *
 * Audited, and both ids are validated before anything is sent: a document
 * belonging to a different company is a 404, and a 404 still writes a row.
 */
export function CustomerDocument() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { id = "", documentId = "" } = useParams()
  const keyLabel = useKeyLabel()

  const validIds = UUID.test(id) && UUID.test(documentId)
  const processing = useDocumentProcessing(id, documentId, validIds)
  const data = processing.data

  const back = (
    <Button variant="ghost" size="sm" asChild className="w-fit">
      <Link to={`/admin/customers/${id}`}>
        <ArrowLeft aria-hidden="true" />
        {t("admin.customer.backToCustomer")}
      </Link>
    </Button>
  )

  if (!validIds) {
    return (
      <div className="space-y-4">
        {back}
        <Alert>
          <AlertDescription>{t("admin.customer.badId")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {back}

      <header className="space-y-1">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {data?.document.filename ?? <Skeleton className="h-8 w-80" />}
        </h1>
        {data ? (
          <p className="text-sm text-ink-500">
            {keyLabel("documentStatus", data.document.status)}
            {data.document.partial ? ` · ${t("admin.customer.partial")}` : ""}
          </p>
        ) : null}
      </header>

      {processing.isError ? (
        <PanelError
          error={processing.error}
          onRetry={() => void processing.refetch()}
        />
      ) : null}

      {data?.document.error_message ? (
        <Alert variant="destructive">
          <AlertDescription>{data.document.error_message}</AlertDescription>
        </Alert>
      ) : null}

      {data?.document.partial_reason ? (
        <Alert>
          <AlertDescription>
            {t("admin.customer.partialReason", {
              reason: data.document.partial_reason,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]">
        <h2 className="mb-4 font-heading text-[17px] leading-tight font-semibold text-navy">
          {t("admin.customer.steps")}
        </h2>
        {processing.isPending ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (data?.steps.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-ink-500">
            {t("admin.customer.noSteps")}
          </p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.customer.step")}</TableHead>
                  <TableHead>{t("admin.customer.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("admin.customer.duration")}
                  </TableHead>
                  <TableHead>{t("admin.customer.when")}</TableHead>
                  <TableHead>{t("admin.customer.details")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.steps ?? []).map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium">
                      {/* Same open vocabulary as the pipeline's step, so the
                          one fallback covers both. */}
                      {keyLabel("pipelineStep", step.step)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={step.status === "error" ? "destructive" : "outline"}
                      >
                        {keyLabel("pipelineStatus", step.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(step.duration_ms, language)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink-500">
                      {formatDateTime(step.created_at, language)}
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      {step.error_message ? (
                        <p className="text-[12px] text-destructive">
                          {step.error_message}
                        </p>
                      ) : null}
                      <StepMetadata metadata={step.metadata} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * `metadata` is free-form JSONB whose keys vary by step — OCR carries page
 * counts, extraction carries a content type and a confidence. Treated as an
 * opaque bag: every scalar is rendered as key/value, nothing is assumed,
 * and nested objects are skipped rather than stringified into noise.
 */
function StepMetadata({ metadata }: { metadata: ProcessingStep["metadata"] }) {
  if (!metadata) return null

  const entries = Object.entries(metadata).filter(
    ([, value]) =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  )
  if (entries.length === 0) return null

  return (
    <ul className="space-y-0.5">
      {entries.map(([key, value]) => (
        <li key={key} className="text-[12px] text-ink-500">
          <span className="font-mono text-ink-400">{key}</span>{" "}
          <span className="tabular-nums">{String(value) || NO_VALUE}</span>
        </li>
      ))}
    </ul>
  )
}
