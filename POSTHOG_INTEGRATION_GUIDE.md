# PostHog Integration Guide

**Document:** `docs/POSTHOG_INTEGRATION_GUIDE.md`
**Audience:** whoever integrates PostHog into `frontend/` (customer app) and `back-office/`.
**Companion:** [`BACKOFFICE_ADMIN_METRICS_GUIDE.md`](BACKOFFICE_ADMIN_METRICS_GUIDE.md) — unrelated; that one is the admin API contract. This is its own document because PostHog spans both frontends while admin metrics concerns only the back-office.
**Backend status:** done and deployed to staging. Three server-side lifecycle events, flag-gated.

PostHog is **the only third-party service in the whole system**, and the only place customer-derived data leaves our infrastructure. That is why this document spends more time on what must *not* be sent than on what must.

---

## 1. What PostHog is for here, and what it is not

It exists for the handful of things our own database structurally cannot see:

1. **Session replay** — watching a co-op manager fail to complete an upload. For a user base with low digital literacy using a French-language compliance tool, often on a phone, this is the single highest-value diagnostic available. **It is live from the start** (a product decision), which makes the masking rules in §6 load-bearing rather than a later refinement.
2. **The pre-authentication funnel** — our database has no row for a person until a company exists. Landing, starting signup, abandoning at email verification: all invisible without this.
3. **In-flow abandonment** — opened the upload dialog, chose a file, gave up before the POST. No server-side trace exists, and this is exactly where a 20 MB file on a bad connection dies.
4. **Rage clicks, dead clicks, client-side exceptions** — frontend errors currently reach nobody.
5. **Feature flags** — staged rollout to one pilot cooperative.

**What it is explicitly not for (ADR-A2):**

- **Any number reported to an investor, partner or grant body.** Those come from Postgres via `/api/v2/admin/metrics/*`, which is exact. PostHog capture is lossy by nature — ad blockers, declined consent, phones dropping off mid-request — and our users are on intermittent connectivity, the worst case for it. Expect PostHog's counts to disagree with the admin dashboard. **The database is the one that is right.**
- **Storing anything about a customer's compliance.** No findings, no producer names, no parcel coordinates, no document contents, ever.

---

## 2. Project configuration (done in the PostHog UI, not in code)

Confirm these are already set before writing any code; the integration assumes them.

| Setting | Value | Why |
|---|---|---|
| Region | **EU** (`eu.i.posthog.com`) | Users fall under ARTCI/Cameroonian law, customers are EUDR-facing. Infrastructure is us-east-1; only telemetry goes to the EU, and the privacy policy must say so rather than imply a single-region story. |
| Autocapture | **OFF** | Explicit events only. Autocapture on a form carrying producer data is precisely how PII leaks. |
| Session replay | **ON** | A product decision: the diagnostic value is wanted immediately. The project-level toggle only *permits* recording — what actually protects customer data is the SDK masking in §6, which must therefore be correct before the first deploy, not after. |
| Person profiles | **Identified only** | Cheaper, and no profile for anonymous traffic. |
| Retention | Replays **30 days**, events **12 months** | Long replay retention is pure liability. |
| Billing limit | Set | Replay volume is what runs away, not event volume. |

The project key is `phc_…`. It is **write-only and designed to be public** — it ships inside the JavaScript bundle, so it belongs in build-time env (`VITE_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_KEY`), not in a secret store. Do not commit it to the repo anyway.

---

## 3. Consent — build this before the SDK

Nothing may be captured before consent. Two **separate** opt-ins:

```
[ ] Analytics   — which pages and steps are used
[ ] Session replay — recordings of this session
```

Rules:

- PostHog initialises with capturing **off**; it is enabled only on consent.
- **Replay stays off even for someone who accepted analytics.** Accepting one is not accepting the other.
- Declining must be as easy as accepting, and the choice must be changeable afterwards (a link in settings).
- Store the choice per user, and re-apply it on every page load before `posthog.init` has a chance to send anything.
- Default on first visit is **not consented**.

Use `opt_out_capturing_by_default: true` and call `posthog.opt_in_capturing()` only after an affirmative choice. For replay, keep it disabled at init and start it separately when that second box is ticked.

The banner copy is bilingual like everything else, through the existing locale files.

---

## 4. Privacy policy (`frontend/app/(legal)/privacy`)

Three additions, all required before production:

1. **PostHog in the sub-processor list.** A customer under EUDR scrutiny will eventually ask for that list.
2. **The region split, stated plainly:** customer data of record stays in us-east-1; behavioural telemetry is processed in the EU. Do not imply a single region.
3. **What is collected and for how long** — analytics events 12 months, session recordings 30 days, and the fact that recordings mask document contents and form inputs.

The DPA with PostHog is signed already.

---

## 5. The event taxonomy

Deliberately small. A sprawling taxonomy nobody trusts is the standard failure mode — about fifteen events total.

**Customer app (`frontend/`):**

```
signup_started            email_verification_sent    onboarding_completed
signup_completed          onboarding_step_viewed  {step}
upload_dialog_opened      upload_file_selected    {mime, size_bucket}
upload_submitted          upload_failed_client    {reason}
checklist_viewed {certification}                  requirement_expanded
declaration_submitted     finding_opened          finding_resolved_clicked
language_switched
```

**Back-office:** a handful of page/action events only. **No replay, ever** — an admin's screen shows several tenants at once, so recording it would disclose one customer's data in a recording about another.

**Already emitted by the backend** (do not duplicate these client-side):

```
document_ingested    {duration_bucket, size_bucket, mime_type}
analysis_completed   {duration_bucket, findings_created, findings_resolved}
document_failed      {step, error_class}
```

These close the funnels that would otherwise end at `upload_submitted` with no visible outcome — both land minutes after the request returned, often after the tab is gone.

### Property rules, which are not negotiable

- **Identify by SuperTokens `user_id` only.** Never email, never name.
- **Company as a PostHog group**, keyed by `company_id` (UUID) — **no company name property**.
- **Bucket durations and file sizes.** Never raw. A precise byte count is a fingerprint and false precision; match the backend's buckets (`under_1mb`, `1mb_5mb`, `5mb_20mb`, `over_20mb`).
- **No free text in any property, ever.** No filenames, no finding titles, no search terms, no error messages — only an error *class*.
- A property that would interest an attacker who breached PostHog does not go.

---

## 6. Implementation notes

**Reverse-proxy the SDK.** This matters more for us than for most products: without a same-origin `/ingest/*` rewrite, ad blockers and some mobile carriers in Côte d'Ivoire and Cameroon will silently drop a meaningful share of events. In Next.js this is a `rewrites()` entry to `https://eu.i.posthog.com`; point the SDK's `api_host` at your own origin.

**Next 14 App Router does not fire route changes the way the SDK assumes.** Set `capture_pageview: false` and send pageviews manually from a client component watching `usePathname()`.

**Init options for the customer app:**

```js
posthog.init(KEY, {
  api_host: "/ingest",              // the proxy, not eu.i.posthog.com
  person_profiles: "identified_only",
  autocapture: false,               // explicit events only
  capture_pageview: false,          // App Router; send manually
  opt_out_capturing_by_default: true,
  disable_session_recording: true,  // until the replay consent box is ticked
})
```

**Masking. This is the load-bearing part of the whole integration.**

Replay is enabled at the project level, so nothing server-side will stop a
recording — the SDK config below is the only control. PostHog's own defaults
mask password inputs and nothing else: ship without this and the first
recording captures a co-op manager's compliance documents in full.

Masking is **opt-out, never opt-in** — the default must be safe so that a page
added later is safe before anyone remembers to make it safe:

```js
session_recording: {
  maskAllInputs: true,
  maskTextSelector: "*",   // then opt specific chrome back in
}
```

Mark these containers `ph-no-capture` explicitly: the document viewer, extracted-data tables, producer and parcel tables, and the findings list.

---

## 7. Rollout order

1. **Backend on staging** — done. `ENABLE_POSTHOG` is wired to `staging-api`
   and `staging-worker` only; production is deliberately not wired, so
   "enable staging" cannot be confused with "enable production".
2. **Consent + privacy policy** (§3, §4). Nothing client-side ships before
   these, replay included.
3. **Masking, verified on staging before any real user is recorded.** With
   project-level replay on, this is the gate. Open a staging session, upload
   a document, walk the checklist, then **watch that recording back** and
   confirm you cannot read: the document viewer, extracted producer data,
   parcel references, finding text, or any form input. If any of it is
   legible, fix the masking before going further — this is a one-way door
   once real customers are recorded.
4. **Customer app live**, analytics and replay together, each on its own
   consent.
5. **Back-office live** — analytics only. **Never replay**, under any
   circumstances.
6. **Production backend** — a one-line Terraform change, after step 2 is
   live.

Step 3 replaces the two-week analytics-only soak that an earlier draft of
this plan recommended. Shipping replay from day one is a deliberate choice;
it trades that soak period for a mandatory masking review, which has to
happen *before* real sessions rather than after.

## 8. Calibration, once both sides run

Compare PostHog's `document_ingested` count with `/api/v2/admin/metrics/overview` for the same window. The gap is your real capture loss on your users' actual connections.

Measure it, write it down, and quote it whenever someone reads a funnel. It is the honest answer to "how much can we trust this number", and it is why the database — not PostHog — remains the source for anything a stakeholder sees.
