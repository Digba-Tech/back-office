// Mirrors BACKOFFICE_ADMIN_GUIDE_V2.md §4 — the admin API contract.

export type AppliesTo = {
  sectors: string[]
  operating_countries: string[]
  export_regions: string[]
  certifications: string[]
}

export type CheckKind = "document_presence" | "deterministic" | "llm"

export type Criticality = "core" | "mandatory" | "improvement"

export type RequirementStatus = "draft" | "active" | "deprecated"

export type ExpectedEvidence = {
  document_types: string[]
  hint: string | null
}

// Bilingual text pair — French is the primary reference language for
// display to cooperatives, English is kept alongside it.
export type Locale2 = { fr: string; en: string }

// V2 Level 2: an actionable to-do a cooperative must complete for this
// requirement.
export type RequirementAction = {
  action_id: string
  title: Locale2
  description?: Locale2 | null
  mandatory: boolean
  order: number
}

export type EvidenceWeight = "formal" | "lightweight"

// V2 Level 3: one item of the evidence checklist proving a requirement's
// actions were actually carried out.
export type EvidenceItem = {
  evidence_id: string
  name: Locale2
  document_types: string[]
  weight: EvidenceWeight
  guidance?: Locale2 | null
  hint?: string | null
}

export type Requirement = {
  id: string
  requirement_key: string // "{standard}:{native_code}"
  standard: string
  native_code: string
  version: string
  title: string
  text: string
  section_ref: string | null
  applies_to: AppliesTo
  check_kind: CheckKind
  check_code: string | null // required if check_kind === "deterministic"
  expected_evidence: ExpectedEvidence
  actions: RequirementAction[]
  evidence_checklist: EvidenceItem[]
  criticality: Criticality
  due_year: number | null // null = due immediately
  status: RequirementStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  source_id: string | null
  regulatory_text_id: string | null
  created_at: string
  superseded_at: string | null
}

// PATCH /admin/requirements/{id} — identity fields (standard, native_code,
// requirement_key) are deliberately not editable here; a renumbering is a
// separate remap, never a silent edit. Only accepted while status="draft".
// actions/evidence_checklist are replaced wholesale, not merged per-row.
export type RequirementEdit = Partial<{
  title: string
  text: string
  section_ref: string | null
  applies_to: AppliesTo
  check_kind: CheckKind
  check_code: string | null
  expected_evidence: ExpectedEvidence
  actions: RequirementAction[]
  evidence_checklist: EvidenceItem[]
  criticality: Criticality
  due_year: number | null
}>

// The source + stored text version a requirement was extracted from.
// `is_latest: false` means the source has been re-ingested since — the
// requirement's `text` may no longer match what's currently on the source.
export type Citation = {
  id: string
  name: string
  url: string | null
  content_md: string
  scraped_at: string | null
  is_latest: boolean
}

// GET /admin/requirements/{id}
export type RequirementWithCitation = {
  requirement: Requirement
  citation: Citation | null
}

export type SourceType = "pdf" | "webpage" | "rss_feed"

export type ScrapeFrequency = "daily" | "weekly" | "monthly"

export type KnowledgeSource = {
  id: string
  name: string
  url: string | null
  storage_path: string | null
  source_type: SourceType
  sectors: string[]
  operating_countries: string[]
  export_regions: string[]
  certifications: string[]
  scrape_frequency: ScrapeFrequency
  deep_crawl: boolean
  applies_to_locked: boolean
  last_scrape_error: string | null
  last_scraped_at: string | null
  is_active: boolean
  created_at: string
}

// POST /admin/sources — url XOR storage_path (storage_path is only set via
// the /pdf upload route in practice).
export type KnowledgeSourceCreate = {
  name: string
  url?: string
  storage_path?: string
  source_type: SourceType
  sectors?: string[]
  operating_countries?: string[]
  export_regions?: string[]
  certifications?: string[]
  scrape_frequency?: ScrapeFrequency // default "monthly"
  deep_crawl?: boolean // default false
}

// PATCH /admin/sources/{id}
export type KnowledgeSourceUpdate = Partial<
  Omit<KnowledgeSourceCreate, "storage_path">
> & {
  applies_to_locked?: boolean
}

// GET /admin/sources/{id}/ingest-status
export type IngestStatus = {
  last_scraped_at: string | null
  last_scrape_error: string | null
}

// GET /admin/sources/monitoring
export type SourcesMonitoring = {
  total: number
  active: number
  inactive: number
  sources: Array<{
    id: string
    name: string
    is_active: boolean
    scrape_frequency: ScrapeFrequency
    last_scraped_at: string | null
    last_scrape_error: string | null
  }>
}

// GET /admin/sources/vocabulary — dropdown options for the create/edit form.
export type SourcesVocabulary = {
  source_types: SourceType[]
  scrape_frequencies: ScrapeFrequency[]
  applies_to: AppliesTo
}

// GET /admin/sources/{id}/texts — version history + one version's content,
// paginated by character offset.
export type SourceTextVersion = {
  id: string
  content_hash: string
  scraped_at: string
}

export type SourceTexts = {
  source_id: string
  history: SourceTextVersion[]
  text_id: string | null
  content: string
  content_char_count: number
  truncated: boolean
}

export type JobStatus = "pending" | "running" | "done" | "error"

// GET /admin/jobs, POST /admin/jobs/{id}/retry — every ingestion/extraction/
// gap-sweep/document/analysis job (migration 021_jobs.sql). `type` isn't a
// closed enum on the frontend — new job types can ship backend-side without
// a matching UI change, so it's rendered with a translation-or-raw-value
// fallback rather than a strict union.
export type Job = {
  id: string
  type: string
  payload: Record<string, unknown>
  status: JobStatus
  dedup_key: string | null
  attempts: number
  max_attempts: number
  run_after: string
  locked_by: string | null
  locked_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}
