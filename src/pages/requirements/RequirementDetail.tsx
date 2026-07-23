import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { InfoTooltip, LabelWithInfo } from "@/components/info-tooltip"
import { SegmentedControl } from "@/components/segmented-control"
import { CriticalityBadge, RequirementStatusBadge } from "@/components/status-badge"
import { TagListInput } from "@/components/tag-list-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/format"

import { useSourcesVocabulary } from "@/pages/sources/queries"
import type { CheckKind, Criticality, Requirement } from "@/lib/types"
import {
  useApproveRequirement,
  useRejectRequirement,
  useRequirement,
  useUpdateRequirement,
} from "./queries"

const CHECK_KINDS: CheckKind[] = ["document_presence", "deterministic", "llm"]
const CRITICALITIES: Criticality[] = ["core", "mandatory", "improvement"]

export function RequirementDetail() {
  const { t, i18n } = useTranslation()
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useRequirement(id)
  const vocabulary = useSourcesVocabulary()
  const updateRequirement = useUpdateRequirement(id)
  const approve = useApproveRequirement(id)
  const reject = useRejectRequirement(id)

  const [rejectReason, setRejectReason] = React.useState("")
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (error || !data) {
    return (
      <p className="text-destructive text-sm">
        {t("requirements.detail.loadFailed", { message: error?.message })}
      </p>
    )
  }

  const { requirement, citation } = data
  const reviewable = requirement.status === "draft"

  async function onApprove() {
    setActionError(null)
    try {
      await approve.mutateAsync()
      setApproveOpen(false)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t("requirements.detail.approveFailed")
      )
    }
  }

  async function onReject() {
    setActionError(null)
    try {
      await reject.mutateAsync(rejectReason)
      setRejectOpen(false)
      setRejectReason("")
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t("requirements.detail.rejectFailed")
      )
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-navy">{requirement.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {requirement.requirement_key}
            </Badge>
            <Badge variant="outline" className="font-mono">
              v{requirement.version}
            </Badge>
            <RequirementStatusBadge status={requirement.status} />
            <CriticalityBadge criticality={requirement.criticality} />
          </div>
          {requirement.reviewed_by && (
            <p className="mt-2 text-sm text-ink-500">
              {requirement.reviewed_at
                ? t("requirements.detail.reviewedByOn", {
                    name: requirement.reviewed_by,
                    date: formatDateTime(requirement.reviewed_at, i18n.language),
                  })
                : t("requirements.detail.reviewedByOnly", {
                    name: requirement.reviewed_by,
                  })}
            </p>
          )}
          {requirement.rejection_reason && (
            <p className="mt-1 text-sm text-destructive">
              {t("requirements.detail.rejectionReason", {
                reason: requirement.rejection_reason,
              })}
            </p>
          )}
        </div>
      </div>

      {!reviewable && (
        <p className="text-sm text-ink-500">
          {t("requirements.detail.notReviewable", {
            status: t(`enums.requirementStatus.${requirement.status}`),
          })}
        </p>
      )}

      {actionError && (
        <p className="text-destructive text-sm" role="alert">
          {actionError}
        </p>
      )}

      {reviewable && (
        <div className="rounded-[10px] border border-[#e9d9ae] bg-attention-tint p-4">
          <p className="mb-3 text-sm text-attention">
            {t("requirements.detail.awaitingReviewNote")}
          </p>
          <div className="flex items-center gap-2">
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive-outline">
                  {t("requirements.detail.reject")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("requirements.detail.rejectDialogTitle")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <LabelWithInfo
                    htmlFor="reject-reason"
                    info={t("requirements.detail.rejectReasonInfo")}
                  >
                    {t("requirements.detail.rejectReasonLabel")}
                  </LabelWithInfo>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    disabled={!rejectReason.trim() || reject.isPending}
                    onClick={onReject}
                  >
                    {reject.isPending
                      ? t("requirements.detail.rejecting")
                      : t("requirements.detail.reject")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <InfoTooltip>{t("requirements.detail.rejectInfo")}</InfoTooltip>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger asChild>
                <Button disabled={approve.isPending}>
                  {approve.isPending
                    ? t("requirements.detail.approving")
                    : t("requirements.detail.approve")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("requirements.detail.approveDialogTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("requirements.detail.approveConfirm")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button disabled={approve.isPending} onClick={onApprove}>
                    {approve.isPending
                      ? t("requirements.detail.approving")
                      : t("requirements.detail.approveConfirmButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <InfoTooltip>{t("requirements.detail.approveInfo")}</InfoTooltip>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("requirements.detail.extractedCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RequirementEditForm
              key={requirement.id}
              requirement={requirement}
              vocabulary={vocabulary.data}
              onSave={(body) => updateRequirement.mutateAsync(body)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("requirements.detail.citationCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-ink-500">
              {t("requirements.detail.citationHelp")}
            </p>
            {citation ? (
              <div className="grid gap-2">
                {!citation.is_latest && (
                  <Alert variant="warning">
                    <AlertDescription>
                      {t("requirements.detail.citationStale")}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {citation.url ? (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-navy hover:underline"
                    >
                      {citation.name}
                    </a>
                  ) : (
                    <span className="font-medium text-navy">{citation.name}</span>
                  )}
                  {citation.scraped_at && (
                    <span className="font-mono text-ink-500">
                      {t("requirements.detail.citationScrapedAt", {
                        date: formatDateTime(citation.scraped_at, i18n.language),
                      })}
                    </span>
                  )}
                </div>
                <blockquote className="max-h-[32rem] overflow-auto rounded-r-md border-l-2 border-l-[#c9d3de] bg-paper p-3 text-sm text-ink-700 italic">
                  {citation.content_md || t("requirements.detail.citationNoContent")}
                </blockquote>
              </div>
            ) : (
              <p className="text-sm text-ink-500">{t("requirements.detail.citationNone")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Button variant="ghost" className="w-fit" onClick={() => navigate("/requirements")}>
        {t("requirements.detail.backToQueue")}
      </Button>
    </div>
  )
}

function RequirementEditForm({
  requirement,
  vocabulary,
  onSave,
}: {
  requirement: Requirement
  vocabulary: ReturnType<typeof useSourcesVocabulary>["data"]
  onSave: (
    body: Parameters<ReturnType<typeof useUpdateRequirement>["mutateAsync"]>[0]
  ) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const [title, setTitle] = React.useState(requirement.title)
  const [text, setText] = React.useState(requirement.text)
  const [sectionRef, setSectionRef] = React.useState(requirement.section_ref ?? "")
  const [checkKind, setCheckKind] = React.useState<CheckKind>(requirement.check_kind)
  const [checkCode, setCheckCode] = React.useState(requirement.check_code ?? "")
  const [criticality, setCriticality] = React.useState<Criticality>(
    requirement.criticality
  )
  const [dueImmediately, setDueImmediately] = React.useState(
    requirement.due_year === null
  )
  const [dueYear, setDueYear] = React.useState(
    requirement.due_year?.toString() ?? ""
  )
  const [sectors, setSectors] = React.useState(requirement.applies_to.sectors)
  const [operatingCountries, setOperatingCountries] = React.useState(
    requirement.applies_to.operating_countries
  )
  const [exportRegions, setExportRegions] = React.useState(
    requirement.applies_to.export_regions
  )
  const [certifications, setCertifications] = React.useState(
    requirement.applies_to.certifications
  )
  const [documentTypes, setDocumentTypes] = React.useState(
    requirement.expected_evidence.document_types
  )
  const [hint, setHint] = React.useState(requirement.expected_evidence.hint ?? "")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title,
        text,
        section_ref: sectionRef || null,
        check_kind: checkKind,
        check_code: checkKind === "deterministic" ? checkCode || null : null,
        criticality,
        due_year: dueImmediately ? null : Number(dueYear) || null,
        applies_to: {
          sectors,
          operating_countries: operatingCountries,
          export_regions: exportRegions,
          certifications,
        },
        expected_evidence: { document_types: documentTypes, hint: hint || null },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("requirements.detail.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="req-title">{t("requirements.detail.fields.title.label")}</Label>
        <Input id="req-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="req-text">{t("requirements.detail.fields.text.label")}</Label>
        <Textarea
          id="req-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-32"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="req-section">
          {t("requirements.detail.fields.sectionRef.label")}
        </Label>
        <Input
          id="req-section"
          value={sectionRef}
          onChange={(e) => setSectionRef(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <LabelWithInfo info={t("requirements.detail.fields.checkKind.info")}>
          {t("requirements.detail.fields.checkKind.label")}
        </LabelWithInfo>
        <SegmentedControl
          value={checkKind}
          onChange={(v) => setCheckKind(v)}
          options={CHECK_KINDS.map((kind) => ({
            value: kind,
            label: t(`enums.checkKind.${kind}`),
          }))}
        />
      </div>
      <div className="grid gap-2">
        <LabelWithInfo info={t("requirements.detail.fields.criticality.info")}>
          {t("requirements.detail.fields.criticality.label")}
        </LabelWithInfo>
        <SegmentedControl
          value={criticality}
          onChange={(v) => setCriticality(v)}
          options={CRITICALITIES.map((c) => ({
            value: c,
            label: t(`enums.criticality.${c}`),
          }))}
        />
      </div>

      {checkKind === "deterministic" && (
        <div className="grid gap-2">
          <LabelWithInfo
            htmlFor="req-check-code"
            info={t("requirements.detail.fields.checkCode.info")}
          >
            {t("requirements.detail.fields.checkCode.label")}
          </LabelWithInfo>
          <Input
            id="req-check-code"
            value={checkCode}
            onChange={(e) => setCheckCode(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <input
            id="due-immediately"
            type="checkbox"
            checked={dueImmediately}
            onChange={(e) => setDueImmediately(e.target.checked)}
          />
          <LabelWithInfo
            htmlFor="due-immediately"
            info={t("requirements.detail.fields.dueImmediately.info")}
          >
            {t("requirements.detail.fields.dueImmediately.label")}
          </LabelWithInfo>
        </div>
        {!dueImmediately && (
          <Input
            type="number"
            value={dueYear}
            onChange={(e) => setDueYear(e.target.value)}
            placeholder={t("requirements.detail.fields.dueYearPlaceholder")}
            className="w-32"
          />
        )}
      </div>

      <TagListInput
        label={t("requirements.detail.fields.sectors.label")}
        value={sectors}
        onChange={setSectors}
        options={vocabulary?.applies_to.sectors}
        info={t("requirements.detail.fields.sectors.info")}
      />
      <TagListInput
        label={t("requirements.detail.fields.operatingCountries.label")}
        value={operatingCountries}
        onChange={setOperatingCountries}
        options={vocabulary?.applies_to.operating_countries}
        info={t("requirements.detail.fields.operatingCountries.info")}
      />
      <TagListInput
        label={t("requirements.detail.fields.exportRegions.label")}
        value={exportRegions}
        onChange={setExportRegions}
        options={vocabulary?.applies_to.export_regions}
        info={t("requirements.detail.fields.exportRegions.info")}
      />
      <TagListInput
        label={t("requirements.detail.fields.certifications.label")}
        value={certifications}
        onChange={setCertifications}
        options={vocabulary?.applies_to.certifications}
        info={t("requirements.detail.fields.certifications.info")}
      />
      <TagListInput
        label={t("requirements.detail.fields.documentTypes.label")}
        value={documentTypes}
        onChange={setDocumentTypes}
        info={t("requirements.detail.fields.documentTypes.info")}
      />
      <div className="grid gap-2">
        <LabelWithInfo
          htmlFor="req-hint"
          info={t("requirements.detail.fields.hint.info")}
        >
          {t("requirements.detail.fields.hint.label")}
        </LabelWithInfo>
        <Textarea id="req-hint" value={hint} onChange={(e) => setHint(e.target.value)} />
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="outline-navy" disabled={saving} className="w-fit">
        {saving ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  )
}
