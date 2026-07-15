import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

import { TagListInput } from "@/components/tag-list-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

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
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useRequirement(id)
  const vocabulary = useSourcesVocabulary()
  const updateRequirement = useUpdateRequirement(id)
  const approve = useApproveRequirement(id)
  const reject = useRejectRequirement(id)

  const [rejectReason, setRejectReason] = React.useState("")
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (error || !data) {
    return (
      <p className="text-destructive text-sm">
        Failed to load requirement: {error?.message}
      </p>
    )
  }

  const { requirement, citation } = data
  const reviewable = requirement.status === "draft"

  async function onApprove() {
    if (!window.confirm(
      "Approving supersedes the prior active version and goes live for every " +
        "customer in scope immediately. Continue?"
    )) {
      return
    }
    setActionError(null)
    try {
      await approve.mutateAsync()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve failed")
    }
  }

  async function onReject() {
    setActionError(null)
    try {
      await reject.mutateAsync(rejectReason)
      setRejectOpen(false)
      setRejectReason("")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reject failed")
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{requirement.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{requirement.requirement_key}</Badge>
            <Badge variant="outline">v{requirement.version}</Badge>
            <Badge variant={requirement.status === "active" ? "default" : "secondary"}>
              {requirement.status}
            </Badge>
            <Badge variant="outline">{requirement.criticality}</Badge>
          </div>
          {requirement.reviewed_by && (
            <p className="text-muted-foreground mt-2 text-sm">
              Reviewed by {requirement.reviewed_by}
              {requirement.reviewed_at &&
                ` on ${new Date(requirement.reviewed_at).toLocaleString()}`}
            </p>
          )}
          {requirement.rejection_reason && (
            <p className="text-destructive mt-1 text-sm">
              Rejection reason: {requirement.rejection_reason}
            </p>
          )}
        </div>

        {reviewable ? (
          <div className="flex gap-2">
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject requirement</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label htmlFor="reject-reason">Reason (required, audit trail)</Label>
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
                    {reject.isPending ? "Rejecting…" : "Reject"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={onApprove} disabled={approve.isPending}>
              {approve.isPending ? "Approving…" : "Approve"}
            </Button>
          </div>
        ) : (
          <Badge variant="outline">Not reviewable ({requirement.status})</Badge>
        )}
      </div>

      {actionError && (
        <p className="text-destructive text-sm" role="alert">
          {actionError}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Extracted requirement</CardTitle>
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
            <CardTitle>Source citation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2 text-sm">
              The exact passage this was extracted from — verify it's not
              hallucinated before approving.
            </p>
            {citation ? (
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {citation}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">No citation on record.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Button variant="ghost" className="w-fit" onClick={() => navigate("/requirements")}>
        ← Back to review queue
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
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="req-title">Title</Label>
        <Input id="req-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="req-text">Text</Label>
        <Textarea
          id="req-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-32"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="req-section">Section reference</Label>
        <Input
          id="req-section"
          value={sectionRef}
          onChange={(e) => setSectionRef(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Check kind</Label>
          <Select value={checkKind} onValueChange={(v) => setCheckKind(v as CheckKind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECK_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Criticality</Label>
          <Select
            value={criticality}
            onValueChange={(v) => setCriticality(v as Criticality)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRITICALITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {checkKind === "deterministic" && (
        <div className="grid gap-2">
          <Label htmlFor="req-check-code">Check code (required for deterministic checks)</Label>
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
          <Label htmlFor="due-immediately">Due immediately (no due year)</Label>
        </div>
        {!dueImmediately && (
          <Input
            type="number"
            value={dueYear}
            onChange={(e) => setDueYear(e.target.value)}
            placeholder="Due year"
            className="w-32"
          />
        )}
      </div>

      <TagListInput
        label="Sectors"
        value={sectors}
        onChange={setSectors}
        options={vocabulary?.applies_to.sectors}
      />
      <TagListInput
        label="Operating countries"
        value={operatingCountries}
        onChange={setOperatingCountries}
        options={vocabulary?.applies_to.operating_countries}
      />
      <TagListInput
        label="Export regions"
        value={exportRegions}
        onChange={setExportRegions}
        options={vocabulary?.applies_to.export_regions}
      />
      <TagListInput
        label="Certifications"
        value={certifications}
        onChange={setCertifications}
        options={vocabulary?.applies_to.certifications}
      />
      <TagListInput
        label="Expected evidence: document types"
        value={documentTypes}
        onChange={setDocumentTypes}
      />
      <div className="grid gap-2">
        <Label htmlFor="req-hint">Expected evidence: hint</Label>
        <Textarea id="req-hint" value={hint} onChange={(e) => setHint(e.target.value)} />
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
