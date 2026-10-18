# Back-office — Admin & Monitoring API Guide

**Document:** `docs/BACKOFFICE_ADMIN_METRICS_GUIDE.md`
**Audience:** whoever builds the back-office `/admin` section (A-9 in [`ADMIN_OBSERVABILITY_PLAN.md`](../ADMIN_OBSERVABILITY_PLAN.md)).
**Status:** the backend is built, migrated and tested. Nothing here is aspirational — every shape below was dumped from a live response.

The backend side (A-0 through A-8) is complete: migrations 040–047, nine endpoints, 1162 passing tests. This document is the contract. It also carries the decisions already made about charts, because several of them are not obvious and one of them contradicts what is currently in the codebase.

---

## 1. Auth

Identical to the rest of the back-office — SuperTokens session cookie, `role: "admin"` claim. `src/lib/api.ts`'s plain `fetch` already works, because `SuperTokens.init()` patches `window.fetch` to attach the session and anti-CSRF header.

- **401** — no/expired session. `AuthProvider` already reacts to this.
- **403** — a valid session that is not an admin.

Base URL is the existing `VITE_API_BASE_URL` (`https://staging-api.digba-tech.com/api/v2`).

---

## 2. The two families, and why it matters that you keep them apart

| | `/admin/metrics/*` | `/admin/customers/*` |
|---|---|---|
| Serves | Cross-tenant **aggregates** | One named customer's **dossier** |
| Contains customer content | No, by construction | Yes — documents, findings, declarations |
| Audited | **No** | **Yes — every single call** |

**Every call to `/admin/customers/*` writes an immutable row to `admin_access_log`.** That is deliberate (it answers "who at Digba looked at our data", which a customer under EUDR scrutiny will eventually ask), and it has one consequence for you:

> **Do not call a `/customers/*` endpoint to populate an aggregate view.** A dashboard that polls `/admin/customers` every 30 seconds writes 2,880 audit rows a day and buries the one entry that mattered. If a page needs a count or a list of names for a chart, it comes from `/admin/metrics/usage` (which returns `companies[]` with no tenant content). The drill-down is for a human who has clicked into one customer.

Aggregates are not audited for the same reason in reverse: a row per page load would drown the trail.

---

## 3. Endpoints

All five metrics endpoints take the same window:

| Param | Type | Default |
|---|---|---|
| `since` | `YYYY-MM-DD`, inclusive | 30 days ago |
| `until` | `YYYY-MM-DD`, inclusive | none (open-ended) |

The window applies only to series that have a time axis. Current-state rollups (`company_activity`, `activation_funnel`, `by_company`, `evidence_quality`, `catalogue`, `resolution_times`) ignore it, so you can thread one date range through every page without special-casing.

### `GET /admin/metrics/overview`

The landing page. One block per metric family.

```json
{
  "window":      { "since": "2026-09-17", "until": null },
  "customers":   { "total": 1, "active": 1, "dormant": 0, "with_open_criticals": 1 },
  "reliability": { "pipeline_runs": 1, "success_pct": 100.0, "errors": 0 },
  "cost":        { "usd": 0.0218, "wasted_usd": null, "calls": 1, "unpriced_calls": 0 },
  "outcomes":    { "findings_opened": 1, "findings_resolved": 0,
                   "resolved_by_user": 0, "resolved_by_system": 0 },
  "funnel":      [ { "step_order": 0, "step": "signed_up", "companies": 1 } ]
}
```

### `GET /admin/metrics/pipeline`

```
daily[]    day, step, runs, successes, errors, skipped, success_pct, p50_ms, p95_ms
latency[]  day, analyses, analyses_with_a_failed_phase, avg_phases, p50_worked_ms, p95_worked_ms
jobs[]     day, job_type, attempts, succeeded, failed, released, still_running,
           distinct_jobs, success_pct, p50_ms, p95_ms
```

`step` is one of `ocr`, `text_extraction`, `entity_extraction`, `cross_analysis`, `certification_analysis`, `score_update`. A step missing from a day means it did not run, not that it never fails.

`jobs[]` counts **attempts**, not jobs. A job that failed once then succeeded is one success in the queue and two attempts here. Label the axis accordingly — "we fail one run in two" and "our jobs eventually pass" are both true and tell very different stories.

### `GET /admin/metrics/costs`

```
daily[]       day, role, model, operation, calls, ok_calls, failed_calls, truncated_calls,
              priced_calls, priced_by_provider, priced_by_rate_card,
              prompt_tokens, completion_tokens, reasoning_tokens, cached_tokens,
              cost_usd, wasted_usd, p50_ms
by_company[]  company_id, company_name, calls, documents_touched,
              prompt_tokens, completion_tokens, cost_usd, wasted_usd,
              cost_per_document, unpriced_calls, first_call_at, last_call_at
```

`wasted_usd` is spend on calls that failed or were truncated — paid for, nothing usable returned. Worth its own tile.

### `GET /admin/metrics/usage`

```
signups[]   day, signups, verified, backfilled_accounts, active_users
funnel[]    step_order, step, companies
companies[] company_id, company_name, company_created_at, certifications_declared,
            documents_total, documents_uploaded, documents_done, documents_error,
            documents_in_flight, first_document_at, last_document_at,
            findings_open, findings_open_critical, findings_resolved, last_finding_at,
            last_analyzed_at, last_activity_at, days_since_activity, is_dormant_30d
```

`companies[]` is the list to drive a customers table — it carries names and counts but no tenant content, and it is **not** audited. Use it, not `/admin/customers`.

`backfilled_accounts` are users imported from before the lifecycle table existed; their `first_seen_at` is an observation date, not a signup date. Keep them out of an acquisition chart or you will show a spike that never happened.

Funnel steps, in order: `signed_up`, `company_created`, `first_document_uploaded`, `first_document_processed`, `first_finding_raised`, `first_finding_resolved`. It is guaranteed monotonic — a step can never exceed the one before it. (Email verification is deliberately *not* a step; coverage is partial, so it would render as a huge fake drop-off. The honest number is `signups[].verified`.)

### `GET /admin/metrics/efficacy`

```
outcomes[]         day, severity, opened, resolved, resolved_by_user, resolved_by_system
resolution_times[] severity, resolved_count, p50_hours, p90_hours
evidence_quality[] standard, model, verdicts, satisfied, satisfied_pct, avg_confidence,
                   confidence_missing, confidence_under_50, confidence_50_to_80,
                   confidence_over_80, last_decided_at
catalogue[]        standard, status, requirements, core_requirements, reviewed,
                   oldest_created_at, newest_created_at, p50_days_to_review
readiness[]        company_id, company_name, snapshot_date, lens, standard,
                   critical_count, warning_count, info_count, overall_progress_pct,
                   completed_requirements, total_requirements, critical_gaps_count
```

`resolved_by_system` means the system cascade closed the finding (the last action was completed); `resolved_by_user` means a person waived it. Those are different stories and should not be one series.

`evidence_quality` reports a confidence **distribution**, not a pass rate against a threshold, because no threshold exists in the product — `satisfies` is the decision and confidence is advisory. Do not invent a cut-off line on the chart; you would be creating one.

### `GET /admin/customers` · `GET /admin/customers/{company_id}` · `.../documents/{document_id}/processing` · `.../access-log`

Audited. `{company_id}` returns `{company, documents[], findings[], readiness[]}`. The processing endpoint returns `{document, steps[]}` — the per-step history that answers "why did this customer's analysis fail", previously only visible in server logs. A document id that belongs to a different company is a 404, not a leak.

`.../access-log` returns who has viewed this customer's data — including the request you just made, since the gate writes before the body runs.

---

## 4. Four things that will bite if you miss them

**1. `null` is not `0`, and rendering it as `0` is a real bug.**
`success_pct: null` means *no runs in the window*, not a 0% success rate. `cost.usd: null` means *nothing was priced*, not free. Both render as "—", never as a number. A quiet Sunday showing "0% success" will cause a panic; a cost page showing "$0.00" will cause a worse decision. `unpriced_calls > 0` next to a cost total means the figure is partial — say so.

**2. Numbers are numbers.** Percentages, durations and money arrive as JSON numbers. They were briefly strings (Postgres `NUMERIC` → `Decimal` → `"99.4"`); that is fixed at the source, so no parsing is needed. If you ever see a quoted number, it is a backend bug — report it rather than working around it.

**3. Money is rounded at source** to 6 decimal places, percentages to 1. Do not re-round upward in the UI and do not sum rounded values expecting them to match a total — ask for the total.

**4. Everything is bilingual.** Every label goes through `src/locales`, same contract as the rest of the product. Numbers and dates need locale-aware formatting: `fr-FR` uses a comma decimal separator and a space thousands separator, so a hardcoded `toFixed(2)` looks broken in French. Note that API values like `step`, `severity`, `lens` and `operation` are stable English **keys**, not display text — translate them client-side, never show them raw.

---

## 5. Charts: decisions already made

### The existing `--chart-1…5` tokens fail validation. Do not use them.

`src/index.css` defines five chart colours. Run as a categorical palette they fail three of five checks:

| Check | Result |
|---|---|
| Lightness band | **FAIL** — `#06214a` far below band; reads as a dark smudge at mark size |
| Chroma floor | **FAIL** — `#06214a`, `#4c5c71`, `#6e7c8e` read as grey, not as identities |
| CVD separation | PASS (ΔE 11.0) |
| **Normal-vision floor** | **FAIL** — `#6e7c8e` ↔ `#4c5c71` at ΔE 11.2, below the floor of 15: two greys that *full-colour* readers cannot reliably tell apart |
| Contrast vs surface | PASS |

They were chosen for badges and accents, where they work. The admin section is the first thing to make them carry series identity. Slot 3 is also `var(--attention)`, a reserved *status* colour — reusing it means amber meaning "warning" in one panel and "Q3" in the next.

### Use these instead, as new `--series-*` tokens

| Slot | Hex | Notes |
|---|---|---|
| 1 | `#0072B2` | |
| 2 | `#D55E00` | |
| 3 | `#CC79A7` | 2.98:1 vs surface — needs visible labels, which the rules below require anyway |
| 4 | `#009E73` | **only with direct labels or texture** (CVD ΔE drops to 7.6) |

Slots 1–3 pass every hard check (worst all-pairs CVD ΔE 9.6, normal-vision 16.4). **Beyond four series: facet into small multiples or fold the tail into "Other". Never generate a fifth hue.**

Add these as new tokens rather than overwriting `--chart-1…5`, which existing components may rely on.

**Digba green is deliberately not a series colour.** `#52b346` fails contrast against the chart surface (2.59:1) and collides with any warm slot under deutan vision. It stays brand chrome and the "good" status colour. Brand identity is carried by the page, not by bar 2.

### Standing rules

- **One y-axis, ever.** Cost and volume are two stacked charts sharing an x-axis, never two scales. This is the single most common way a dashboard misleads.
- **No pie or donut.** Composition across more than two slices is a stacked bar you can actually read.
- Categorical hues in **fixed order, never cycled**; colour follows the entity, so a filter that drops a series must not repaint the survivors.
- Legend whenever there are ≥2 series; direct labels at ≤4.
- Status colours (good/warning/serious/critical) are reserved — never reused as "series 4", and always paired with an icon or label, never colour alone.
- A **"view as table" toggle on every panel.** This is also the accessibility relief that slot 3's contrast requires.

### Which form each metric takes

Decided so panels are not improvised. For a surprising share of this list, the answer is not a chart.

| Metric | Form |
|---|---|
| Documents today, active customers, MTD cost | Stat tile + delta |
| Queue depth, oldest pending age | Stat tile, status-coloured |
| Stuck jobs, failed documents | Table, newest first |
| Documents by status over time | Stacked bars, daily (status palette) |
| Success rate per step | Horizontal bars, sorted |
| p50/p95 per step | Grouped bars or two small multiples |
| Cost over time by role | Stacked area, weekly |
| Cost per company | Horizontal bars, top 10 + "Other" |
| Activation funnel | Horizontal funnel bars with step labels — never a tapered 3-D funnel |
| Signups / active users | Line, 2 series, direct-labelled at the right edge |
| Findings opened vs resolved | Line, 2 series — the gap between them is the story |
| Time-to-resolution | **Histogram, not an average** — a mean hides the bimodality, which is the actionable part |
| Requirement coverage per certification | Horizontal stacked bars, one row per certification |
| Evidence confidence distribution | Histogram |
| Per-customer timeline | Table with inline status badges |

---

## 6. Open question for you

**Dark mode is declared and unimplemented.** `next-themes` is installed and `@custom-variant dark` is declared in `index.css`, but there is no `.dark` token block. If dark mode ships, the series palette needs its **own validated steps** — an automatic lightening fails the lightness band (verified, not assumed). Cheaper to decide before four chart wrappers exist than after.

---

## 7. Suggested routes

`/admin/overview`, `/admin/pipeline`, `/admin/costs`, `/admin/customers`, `/admin/customers/:id`, `/admin/report?month=` (print-clean, for the monthly stakeholder pack).

A charting foundation of four wrappers — `<TimeSeries>`, `<CategoryBars>`, `<StackedBars>`, `<StatTile>` — is worth building first, so the rules in §5 are enforced once rather than per panel. The repo has no charting library yet; Recharts fits the existing React 19 + Radix stack.

---

## 8. Answers to the first round of frontend questions

### 8.1 `GET /admin/jobs` now takes `job_type` and `since` — added

```
?status_filter=running,error   comma-separated; pending|running|done|error
?job_type=analyze_company      comma-separated; validated against the registry
?since=2026-10-01T00:00:00Z    filters on updated_at, matching the sort order
?limit=100
```

An unknown `job_type` is a **400**, not an empty list: a typo and a type with no jobs look identical otherwise, and only one of them is a bug. URL-encode `since` — an ISO datetime's `+00:00` becomes a space unencoded and the request 422s.

### 8.2 Complete value lists, and which ones can grow

**Closed** — constrained by a database CHECK, so a new value needs a migration and you would hear about it:

| Key | Values |
|---|---|
| `severity` | `critical`, `warning`, `info` |
| job `status` | `pending`, `running`, `done`, `error` |
| attempt `status` (job_reliability) | `running`, `done`, `error`, `released` |
| pipeline `status` (daily_pipeline_health) | `success`, `error`, `skipped` |
| document `status` | `pending`, `processing`, `extracted`, `done`, `error` |
| requirement `status` (catalogue) | `draft`, `active`, `deprecated` |
| `criticality` | `core`, `mandatory`, `improvement` |

**Closed in practice** — not a DB constraint but a fixed list in code; a change is a backend release:

| Key | Values |
|---|---|
| `lens` | `traceability_check`, `eudr_readiness`, `rainforest_audit_readiness`, `fairtrade_audit_readiness` |
| `job_type` | `ingest_document`, `analyze_company`, `ingest_source`, `extract_requirements`, `gap_sweep`, `backfill_requirement_i18n`, `snapshot_readiness` |
| funnel `step` | `signed_up`, `company_created`, `first_document_uploaded`, `first_document_processed`, `first_finding_raised`, `first_finding_resolved` |

**Open** — free TEXT by design, so a new analyzer or pipeline phase can ship without a migration. **These need a fallback**; render an unknown value humanised rather than blank:

| Key | Values today |
|---|---|
| pipeline `step` | `ocr`, `text_extraction`, `entity_extraction`, `cross_analysis`, `certification_analysis`, `score_update` |
| `operation` (costs) | `entity_extraction`, `tabular_extraction`, `ocr_page`, `cross_analysis`, `compliance_analysis`, `certification_analysis`, `evidence_adjudication`, `requirement_extraction`, `gap_sweep`, `source_ingestion`, `requirement_i18n_backfill`, plus `unattributed` |
| `standard` | `rainforest_alliance`, `fairtrade`, `eudr` — grows when a certification is added |
| `model` | whatever is configured, e.g. `bedrock-mantle/zai.glm-5` |
| `role` (costs) | `extraction`, `reasoning`, `vision` |

### 8.3 `/admin/report` — endpoint added, do not compose it client-side

`GET /admin/metrics/report?month=YYYY-MM` returns the month aggregated **server-side**, with blocks `adoption`, `engagement`, `efficacy`, `reliability`, `economics` — plus `previous`, the prior month in the same shape, so the page can render deltas without a second request. (`previous.previous` is always `null`: one month back is a comparison, two would be a chain.)

A delta is only meaningful when both sides exist. Where `previous` has a `null`, show no delta rather than treating it as zero — "+12" against a missing number invents a trend out of a gap in the data.

Composing the five daily endpoints and summing would give a subtly wrong total: those values are already rounded (percentages to 1dp, money to 6dp), and adding rounded numbers is how a monthly figure stops matching the invoice. A malformed month is a 422 from the pattern, an invalid date a 400.

### 8.4 Yes, an open-ended window includes today's partial day — and now says so

Every window is now an object:

```json
"window": { "since": "2026-09-17", "until": null,
            "last_day": "2026-10-17", "includes_partial_day": true }
```

When `includes_partial_day` is true, the final point of every time series covers a few hours rather than a full day. **Mark it or drop it — your choice, but make it deliberately.** Rendering it plain shows a cliff that looks like an outage. The backend does not drop it, because for a live dashboard today's partial data is often the most interesting.

### 8.5 Yes, `company_id` is the same identifier everywhere

`companies.id`. The `company_id` in `/admin/metrics/usage`'s `companies[]`, in `llm_cost_by_company`, in `readiness_trend` and in the `/admin/customers/{company_id}` path are all the same UUID. A row in the unaudited table links straight to the audited dossier — which is the intended flow.

### 8.6 Job payload keys, per type

| `type` | `payload` |
|---|---|
| `ingest_document` | `{document_id}` |
| `analyze_company` | `{company_id}` |
| `ingest_source` | `{source_id, deep}` |
| `extract_requirements` | `{source_id, regulatory_text_id}` |
| `gap_sweep` | `{source_id, regulatory_text_id}` |
| `snapshot_readiness` | `{snapshot_date}` |
| `backfill_requirement_i18n` | `{limit}` (optional) |

Reliable per type, but `payload` is JSONB with no schema — treat a missing key as unlinkable rather than assuming.

### 8.7 `statement_timeout` is 30s, and a timeout is a **503** with a reason

It was promised in the plan against a database role that was later dropped, so it genuinely did not exist until now. Analytics reads are capped at 30s via `SET LOCAL` (transaction-scoped, so it cannot leak onto a pooled connection). On exceeding it:

```json
HTTP 503
{ "detail": "This query took too long. Narrow the date window and retry.",
  "reason": "analytics_timeout",
  "timeout_ms": 30000 }
```

Branch on `reason`, not the message — the message is user-facing text and will be translated. A panel can then render "this window is too wide" instead of a generic failure.

### 8.8 Yes, a 404 still writes an audit row

The gate runs before the route body, so an access is recorded even when the thing is not found. Deliberate: over-logging an attempted access is the conservative error for an audit trail, and "someone tried to open a document under this company" is exactly the sort of thing you would want on record. A mistyped link will therefore appear in that customer's access log. A **403** writes nothing — no data was seen, so there is nothing to audit.

### 8.9 Rates are dated, and the UI should say so

`/admin/metrics/costs` now returns `rate_card[]`:

```json
{ "model": "bedrock-mantle/zai.glm-5", "input_usd_per_mtok": 1.0,
  "output_usd_per_mtok": 3.2, "cached_input_usd_per_mtok": null,
  "effective_from": "2026-10-17",
  "source": "aws pricing get-products AmazonBedrock us-east-1, 2026-10-17" }
```

**Put this on the costs page**, e.g. "Token rates as of 17 Oct 2026 — AWS Pricing API". Costs for models AWS prices are derived from this card, not from an invoice: if AWS changes a price and nobody re-runs `scripts/sync_bedrock_pricing.py`, the figures drift quietly. Surfacing the date is what keeps that in front of whoever is reading the number. `unpriced_calls > 0` means part of the total has no rate at all and the figure is incomplete — worth a warning rather than a footnote.
