// Mirrors BACKOFFICE_ADMIN_GUIDE.md §3 — the admin API contract.

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
// separate remap, never a silent edit.
export type RequirementEdit = Partial<{
  title: string
  text: string
  section_ref: string | null
  applies_to: AppliesTo
  check_kind: CheckKind
  check_code: string | null
  expected_evidence: ExpectedEvidence
  criticality: Criticality
  due_year: number | null
}>

// GET /admin/requirements/{id}
export type RequirementWithCitation = {
  requirement: Requirement
  citation: string | null
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
  versions: SourceTextVersion[]
  text_id: string
  content: string
  offset: number
  limit: number
  total_length: number
}
