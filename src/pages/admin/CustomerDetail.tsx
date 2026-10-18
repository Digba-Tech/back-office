import * as React from "react"
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
import { NO_VALUE, formatCount, formatDateTime, formatPercent } from "@/lib/format"

import { useKeyLabel } from "./keys"
import { useAccessLog, useCustomerDossier } from "./queries"
import type { Severity } from "./types"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The audited drill-down. Every load writes an immutable row to
 * `admin_access_log`, which is the point — it answers "who at Digba looked
 * at our data", a question a customer under EUDR scrutiny will eventually
 * ask.
 *
 * The id is validated here rather than sent straight on, because a 404
 * still writes an audit row: the gate runs before the route body. A
 * mistyped link would otherwise land in a real customer's access log.
 */
export function CustomerDetail() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { id = "" } = useParams()
  const keyLabel = useKeyLabel()

  const validId = UUID.test(id)
  const dossier = useCustomerDossier(id, validId)

  const [showLog, setShowLog] = React.useState(false)
  const accessLog = useAccessLog(id, validId && showLog)

  const data = dossier.data
  const count = (value: number | null | undefined) => formatCount(value, language)
  const when = (value: string | null | undefined) =>
    value ? formatDateTime(value, language) : NO_VALUE

  if (!validId) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>
          <AlertDescription>{t("admin.customer.badId")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BackLink />

      <header className="space-y-1">
        <h1 className="font-heading text-[28px] leading-tight font-semibold text-navy">
          {data?.company.name ?? <Skeleton className="h-8 w-64" />}
        </h1>
      </header>

      {/* Said out loud, because it is true and the person looking should
          know it before they look further. */}
      <Alert>
        <AlertDescription>{t("admin.customer.auditedNotice")}</AlertDescription>
      </Alert>

      {dossier.isError ? (
        <PanelError error={dossier.error} onRetry={() => void dossier.refetch()} />
      ) : null}

      {dossier.isPending || !data ? (
        <Skeleton className="h-[320px] w-full rounded-[10px]" />
      ) : (
        <>
          <Card title={t("admin.customer.profile")}>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={t("admin.customer.sectors")}>
                {data.company.sectors.join(", ") || NO_VALUE}
              </Field>
              <Field label={t("admin.customer.countries")}>
                {data.company.operating_countries.join(", ") || NO_VALUE}
              </Field>
              <Field label={t("admin.customer.exportRegions")}>
                {data.company.export_regions.join(", ") || NO_VALUE}
              </Field>
              <Field label={t("admin.customer.certifications")}>
                {data.company.certifications.join(", ") || NO_VALUE}
              </Field>
              <Field label={t("admin.customer.created")}>
                {when(data.company.created_at)}
              </Field>
              <Field label={t("admin.customer.lastAnalyzed")}>
                {when(data.company.last_analyzed_at)}
              </Field>
            </dl>
          </Card>

          <Card title={t("admin.customer.readiness")}>
            {data.readiness.length === 0 ? (
              <Empty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.customer.standard")}</TableHead>
                    <TableHead>{t("admin.customer.lens")}</TableHead>
                    <TableHead className="text-right">
                      {t("admin.customer.progress")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.customer.requirements")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("admin.keys.severity.critical")}
                    </TableHead>
                    <TableHead>{t("admin.customer.snapshot")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.readiness.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{keyLabel("standard", row.standard)}</TableCell>
                      <TableCell>{keyLabel("lens", row.lens)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(row.overall_progress_pct, language)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {count(row.completed_requirements)} /{" "}
                        {count(row.total_requirements)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.critical_count > 0 ? (
                          <Badge variant="destructive">{count(row.critical_count)}</Badge>
                        ) : (
                          count(row.critical_count)
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-500">
                        {row.snapshot_date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card title={t("admin.customer.findings")}>
            {data.findings.length === 0 ? (
              <Empty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.customer.severity")}</TableHead>
                    <TableHead>{t("admin.customer.finding")}</TableHead>
                    <TableHead>{t("admin.customer.detected")}</TableHead>
                    <TableHead>{t("admin.customer.state")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.findings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell>
                        <SeverityBadge severity={finding.severity} />
                      </TableCell>
                      <TableCell className="max-w-[480px]">
                        <p className="font-medium">{finding.title}</p>
                        {finding.description ? (
                          <p className="text-[12px] text-ink-500">
                            {finding.description}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-500">
                        {when(finding.detected_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {finding.resolved ? (
                          <span className="text-ink-500">
                            {t("admin.customer.resolvedAt", {
                              when: when(finding.resolved_at),
                            })}
                          </span>
                        ) : (
                          <Badge variant="outline">{t("admin.customer.open")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card title={t("admin.customer.documents")}>
            {data.documents.length === 0 ? (
              <Empty />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.customer.filename")}</TableHead>
                    <TableHead>{t("admin.customer.type")}</TableHead>
                    <TableHead>{t("admin.customer.status")}</TableHead>
                    <TableHead>{t("admin.customer.uploaded")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.filename}</TableCell>
                      <TableCell className="text-ink-500">
                        {document.detected_type
                          ? keyLabel("documentType", document.detected_type)
                          : NO_VALUE}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={document.status === "error" ? "destructive" : "outline"}
                        >
                          {keyLabel("documentStatus", document.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-500">
                        {when(document.uploaded_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/customers/${id}/documents/${document.id}`}>
                            {t("admin.customer.processing")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <Card title={t("admin.customer.accessLog")}>
        {!showLog ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-500">{t("admin.customer.accessLogHint")}</p>
            <Button type="button" variant="outline" onClick={() => setShowLog(true)}>
              {t("admin.customer.showAccessLog")}
            </Button>
          </div>
        ) : accessLog.isPending ? (
          <Skeleton className="h-[160px] w-full" />
        ) : accessLog.isError ? (
          <PanelError error={accessLog.error} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.customer.when")}</TableHead>
                <TableHead>{t("admin.customer.who")}</TableHead>
                <TableHead>{t("admin.customer.action")}</TableHead>
                <TableHead>{t("admin.customer.path")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accessLog.data?.entries ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-ink-500">
                    {when(entry.created_at)}
                  </TableCell>
                  <TableCell>{entry.admin_email}</TableCell>
                  <TableCell>{keyLabel("accessAction", entry.action)}</TableCell>
                  <TableCell className="font-mono text-[12px] text-ink-500">
                    {entry.request_path}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const keyLabel = useKeyLabel()
  return (
    <Badge variant={severity === "critical" ? "destructive" : "outline"}>
      {keyLabel("severity", severity)}
    </Badge>
  )
}

function BackLink() {
  const { t } = useTranslation()
  return (
    <Button variant="ghost" size="sm" asChild className="w-fit">
      <Link to="/admin/customers">
        <ArrowLeft aria-hidden="true" />
        {t("admin.customer.back")}
      </Link>
    </Button>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]">
      <h2 className="mb-4 font-heading text-[17px] leading-tight font-semibold text-navy">
        {title}
      </h2>
      <div className="overflow-auto">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] font-medium tracking-wide text-ink-400 uppercase">
        {label}
      </dt>
      <dd className="text-sm text-ink-700">{children}</dd>
    </div>
  )
}

function Empty() {
  const { t } = useTranslation()
  return <p className="py-6 text-center text-sm text-ink-500">{t("admin.panel.empty")}</p>
}
