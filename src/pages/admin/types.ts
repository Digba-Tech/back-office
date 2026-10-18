import type { MetricsWindow } from "./window"

// Response shapes for /admin/metrics/*. Kept on the admin face rather than
// in src/lib/types.ts, which covers the knowledge face and the job queue.
//
// Closed key sets are unions: they are constrained by a database CHECK or a
// fixed list in code, so a new value needs a migration or a backend release
// and we would hear about it (metrics guide §8.2). Open key sets stay
// `string` by design — a new analyzer or pipeline phase ships without a
// migration, so they get a humanised fallback at render time, never a
// blank cell.

// --- Closed key sets -------------------------------------------------------

export type Severity = "critical" | "warning" | "info"
export type AttemptStatus = "running" | "done" | "error" | "released"
export type PipelineStatus = "success" | "error" | "skipped"
export type DocumentStatus = "pending" | "processing" | "extracted" | "done" | "error"
export type RequirementStatus = "draft" | "active" | "deprecated"
export type Criticality = "core" | "mandatory" | "improvement"

export type Lens =
  | "traceability_check"
  | "eudr_readiness"
  | "rainforest_audit_readiness"
  | "fairtrade_audit_readiness"

export type JobType =
  | "ingest_document"
  | "analyze_company"
  | "ingest_source"
  | "extract_requirements"
  | "gap_sweep"
  | "backfill_requirement_i18n"
  | "snapshot_readiness"

/** Guaranteed monotonic: a step can never exceed the one before it. */
export type FunnelStepKey =
  | "signed_up"
  | "company_created"
  | "first_document_uploaded"
  | "first_document_processed"
  | "first_finding_raised"
  | "first_finding_resolved"

// --- Open key sets ---------------------------------------------------------
// Free TEXT at the source. Render through humanizeKey when untranslated.

/** `ocr`, `text_extraction`, `entity_extraction`, … — can grow. */
export type PipelineStep = string
/** `entity_extraction`, `ocr_page`, …, plus `unattributed`. */
export type CostOperation = string
/** `rainforest_alliance`, `fairtrade`, `eudr` — grows with certifications. */
export type Standard = string
/** `extraction`, `reasoning`, `vision`. */
export type CostRole = string

// --- /admin/metrics/overview ----------------------------------------------

export type FunnelStep = {
  step_order: number
  step: FunnelStepKey
  companies: number
}

export type MetricsOverview = {
  window: MetricsWindow
  customers: {
    total: number
    active: number
    dormant: number
    with_open_criticals: number
  }
  reliability: {
    pipeline_runs: number
    /** null means no runs in the window — NOT a 0% success rate. */
    success_pct: number | null
    errors: number
  }
  cost: {
    /** null means nothing was priced — NOT free. */
    usd: number | null
    /** Spend on calls that failed or were truncated: paid for, nothing usable. */
    wasted_usd: number | null
    calls: number
    /** Greater than zero means the total is partial and the UI must say so. */
    unpriced_calls: number
  }
  outcomes: {
    findings_opened: number
    findings_resolved: number
    /** A person waived it. */
    resolved_by_user: number
    /** The system cascade closed it. A different story — never one series. */
    resolved_by_system: number
  }
  funnel: FunnelStep[]
}

// --- /admin/metrics/pipeline ----------------------------------------------

export type PipelineDaily = {
  day: string
  step: PipelineStep
  runs: number
  successes: number
  errors: number
  skipped: number
  success_pct: number | null
  p50_ms: number | null
  p95_ms: number | null
}

export type PipelineLatency = {
  day: string
  analyses: number
  analyses_with_a_failed_phase: number
  avg_phases: number | null
  p50_worked_ms: number | null
  p95_worked_ms: number | null
}

/**
 * Counts attempts, not jobs: a job that failed once then succeeded is one
 * success in the queue and two attempts here. "We fail one run in two" and
 * "our jobs eventually pass" are both true — label the axis accordingly.
 */
export type PipelineJobs = {
  day: string
  job_type: JobType
  attempts: number
  succeeded: number
  failed: number
  released: number
  still_running: number
  distinct_jobs: number
  success_pct: number | null
  p50_ms: number | null
  p95_ms: number | null
}

export type MetricsPipeline = {
  window: MetricsWindow
  daily: PipelineDaily[]
  latency: PipelineLatency[]
  jobs: PipelineJobs[]
}

// --- /admin/metrics/costs -------------------------------------------------

export type CostDaily = {
  day: string
  role: CostRole
  model: string
  operation: CostOperation
  calls: number
  ok_calls: number
  failed_calls: number
  truncated_calls: number
  priced_calls: number
  priced_by_provider: number
  priced_by_rate_card: number
  prompt_tokens: number
  completion_tokens: number
  reasoning_tokens: number
  cached_tokens: number
  cost_usd: number | null
  wasted_usd: number | null
  p50_ms: number | null
}

export type CostByCompany = {
  company_id: string
  company_name: string
  calls: number
  documents_touched: number
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number | null
  wasted_usd: number | null
  cost_per_document: number | null
  unpriced_calls: number
  first_call_at: string | null
  last_call_at: string | null
}

/**
 * Rates are derived from the AWS Pricing API, not from an invoice. If a
 * price changes and nobody re-runs the sync, the figures drift quietly —
 * so `effective_from` belongs on the page, not in a footnote (§8.9).
 */
export type RateCard = {
  model: string
  input_usd_per_mtok: number | null
  output_usd_per_mtok: number | null
  cached_input_usd_per_mtok: number | null
  effective_from: string
  source: string
}

export type MetricsCosts = {
  window: MetricsWindow
  daily: CostDaily[]
  by_company: CostByCompany[]
  rate_card: RateCard[]
}

// --- /admin/metrics/usage -------------------------------------------------

export type UsageSignups = {
  day: string
  signups: number
  verified: number
  /**
   * Users imported from before the lifecycle table existed. Their
   * first_seen_at is an observation date, not a signup date — keep them out
   * of an acquisition chart or it shows a spike that never happened.
   */
  backfilled_accounts: number
  active_users: number
}

/**
 * Carries names and counts but no tenant content, and is NOT audited. This
 * is what drives a customers table — never /admin/customers, which writes
 * an audit row per call.
 */
export type CompanyUsage = {
  company_id: string
  company_name: string
  company_created_at: string
  certifications_declared: number
  documents_total: number
  documents_uploaded: number
  documents_done: number
  documents_error: number
  documents_in_flight: number
  first_document_at: string | null
  last_document_at: string | null
  findings_open: number
  findings_open_critical: number
  findings_resolved: number
  last_finding_at: string | null
  last_analyzed_at: string | null
  last_activity_at: string | null
  days_since_activity: number | null
  is_dormant_30d: boolean
}

export type MetricsUsage = {
  window: MetricsWindow
  signups: UsageSignups[]
  funnel: FunnelStep[]
  companies: CompanyUsage[]
}

// --- /admin/metrics/efficacy ----------------------------------------------

export type EfficacyOutcome = {
  day: string
  severity: Severity
  opened: number
  resolved: number
  resolved_by_user: number
  resolved_by_system: number
}

export type ResolutionTime = {
  severity: Severity
  resolved_count: number
  p50_hours: number | null
  p90_hours: number | null
}

/**
 * A confidence distribution, not a pass rate against a threshold: no
 * threshold exists in the product — `satisfies` is the decision and
 * confidence is advisory. Drawing a cut-off line would create one.
 */
export type EvidenceQuality = {
  standard: Standard
  model: string
  verdicts: number
  satisfied: number
  satisfied_pct: number | null
  avg_confidence: number | null
  confidence_missing: number
  confidence_under_50: number
  confidence_50_to_80: number
  confidence_over_80: number
  last_decided_at: string | null
}

export type CatalogueRow = {
  standard: Standard
  status: RequirementStatus
  requirements: number
  core_requirements: number
  reviewed: number
  oldest_created_at: string | null
  newest_created_at: string | null
  p50_days_to_review: number | null
}

export type ReadinessRow = {
  company_id: string
  company_name: string
  snapshot_date: string
  lens: Lens
  standard: Standard
  critical_count: number
  warning_count: number
  info_count: number
  overall_progress_pct: number | null
  completed_requirements: number
  total_requirements: number
  critical_gaps_count: number
}

export type MetricsEfficacy = {
  window: MetricsWindow
  outcomes: EfficacyOutcome[]
  resolution_times: ResolutionTime[]
  evidence_quality: EvidenceQuality[]
  catalogue: CatalogueRow[]
  readiness: ReadinessRow[]
}
