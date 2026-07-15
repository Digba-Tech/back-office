# Back-Office Admin App — Auth Setup & API Guide

**Implements:** ADR-3 (`IMPLEMENTATION_ROADMAP.md`) — Supabase admin role +
forwarded JWT. Resolves `HANDOFF_BACKEND.md` §1/§2.

## ⚠️ Read this first — who does what

This document mixes two different parties' responsibilities. Only one of them is
yours if you are the agent/team **building the back-office client app**.

| | Owner | Where in this doc |
|---|---|---|
| Creating the 3 founder Supabase accounts | **Backend/ops team** (run once per environment, needs the service-role key) | §1 — reference only, not your task |
| Flagging those accounts as admin | **Backend/ops team** (runs a script with the service-role key) | §1 — reference only, not your task |
| CORS allow-listing the back-office's origin | **Backend/ops team** (edits the backend's env config) | §1 — reference only, not your task |
| **Building the login screen + Supabase client** | **✅ You (back-office client app)** | §2 |
| **Forwarding the session JWT on every request** | **✅ You (back-office client app)** | §2 |
| **Calling the admin endpoints to manage sources & review requirements** | **✅ You (back-office client app)** | §3 |

**If you are building the client app: you never touch the service-role key, you
never create or provision accounts, and you don't configure the backend's env.**
Someone will hand you 3 working founder logins (email + the password they set
themselves via Supabase) — your app's job starts at "a founder enters their
email and password into a login form." Everything before that is out of scope
for you; read §1 only so you understand *why* login works the way it does, not
because you need to execute any of it.

---

## §1 — What the backend/ops team has already set up (not your task)

You can skip straight to §2 if you just want to start building. This section
exists so the login flow in §2 makes sense — nothing here is something the
client app does or calls.

**The 3 founder accounts.** The backend/ops team creates each founder as a
normal Supabase Auth user (Dashboard → Authentication → Users → "Invite user" —
the founder gets an email and sets their own password; nobody else ever sees or
sets it), then runs a one-time operator script
(`scripts/provision_admin.py founder@email`, using the backend's
`SUPABASE_SERVICE_KEY`) that stamps `app_metadata: {"role": "admin"}` on their
account. This is **not an API endpoint** — there is no route on this backend
that grants admin access, by design. It survives password resets (the flag
lives on the account, not the credential). If a 4th person ever needs access,
the backend/ops team runs the script again for them — there's no self-service
admin signup, ever.

**CORS.** The backend/ops team adds the back-office app's deployed origin
(whatever host/port it runs on) to the backend's `ALLOWED_ORIGINS` env var in
every environment. If your app's requests are blocked by the browser before
they even reach the backend, this is almost certainly the cause — tell the
backend/ops team your app's origin.

**Why this matters for you:** because of the above, the client app never holds
a service-role key, never has a "create account" flow, and never needs a
backend endpoint to check "is this email an admin" — that's already baked into
the JWT every founder gets when they log in (see §2).

---

## §2 — Your task: the back-office client app (login + auth plumbing)

### What you need

- `SUPABASE_URL` — same Supabase project as the backend (ask for it).
- `SUPABASE_ANON_KEY` — the **public** anon key. This is safe to embed in a
  browser app; it is not a secret. **You will never receive, need, or use the
  service-role key — do not ask for it, and refuse it if offered by mistake.**

### Build a normal Supabase-authenticated app

1. Initialize a Supabase client (any official SDK) with the URL + anon key
   above.
2. Build a login screen using the Supabase Auth SDK's own sign-in (email +
   password is simplest and matches how founders set their password in §1;
   magic-link works too if you prefer — your choice, this backend doesn't care
   which Supabase Auth method you use).
3. Let the SDK manage the session (it issues an access token JWT and refreshes
   it automatically — don't hand-roll token expiry/refresh logic).
4. On **every** request to this backend's admin endpoints (all under
   `/api/v1/admin/*`), attach the current session's access token:
   ```
   Authorization: Bearer <session.access_token>
   ```

### How the backend responds

- **`401 Unauthorized`** — token missing, malformed, expired, or otherwise
  invalid. Action: re-authenticate or let the SDK refresh the session and retry.
- **`403 Forbidden`** — the token is valid (a real logged-in Supabase user) but
  their account isn't flagged admin. This means either the person genuinely
  isn't a founder/admin, or §1's provisioning step hasn't been run for them yet
  — that's a backend/ops fix, not something your app can resolve client-side.
  Show a clear "not authorized as admin" state; don't retry automatically.
- **Anything else** — the request went through; see §3 for each endpoint's
  contract.

### End-to-end picture (for your own understanding — you only build the left column)

```
Your app (back-office client)                         This backend
──────────────────────────────                         ────────────
1. Login form → Supabase Auth SDK
   (SUPABASE_URL + ANON key)
        │
2. Supabase validates, SDK returns
   a session with access_token
        │
3. Attach to every admin call:
   Authorization: Bearer <token>  ──────────────────▶  4. get_current_user validates the
                                                           JWT against Supabase, then
                                                           require_admin checks
                                                           app_metadata.role == "admin"
                                                        ──▶ 401 (bad token) / 403 (not admin)
                                                           / else runs the request using
                                                           service-role internally — that
                                                           credential never leaves the backend
```

### Hard rules for your app

- **No password storage or custom login form that posts credentials to this
  backend** — there is no such endpoint. Login happens entirely against
  Supabase via its SDK.
- **Never bundle or request the service-role key.** If a task ever seems to
  require it, that task belongs to the backend/ops team, not this app.
- **No customer-facing endpoints** (`/api/v1/companies`, `/documents`, etc.) —
  those belong to the separate customer frontend (`docs/FRONTEND_API_GUIDE.md`).
  Note: an admin's JWT is still a normal valid Supabase user token, so those
  routes wouldn't reject it outright — it's just not this app's job to call them.

---

## §3 — Your task: the admin API contract

Everything below requires the `Authorization: Bearer <admin JWT>` header from
§2. All routes are prefixed `/api/v1/admin`.

### Requirements review (`/api/v1/admin/requirements`) — approve the catalog

The regulatory requirements catalog (see `docs/BACKEND_OVERVIEW.md`) is
extracted by an automated backend job into `status='draft'` rows. **Nothing in
`draft` affects any customer's compliance verdict** until an admin approves it
through this app.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/requirements?standard=&status_filter=` | The review queue. Pass `status_filter=draft` for what needs review. |
| GET | `/admin/requirements/{id}` | One requirement + its source citation (`{requirement, citation}`) — the exact passage it was extracted from, so the founder can verify it's not hallucinated before approving. |
| PATCH | `/admin/requirements/{id}` | Correct fields before approving (`RequirementEdit` — title/text/section_ref/applies_to/check_kind/check_code/expected_evidence/criticality/due_year). Identity fields (`standard`, `native_code`, `requirement_key`) are **not** editable — a renumbering is a separate remap, never a silent edit. |
| POST | `/admin/requirements/{id}/approve` | `draft` → `active`. Supersedes the prior active version of the same `requirement_key`. Records who approved it (the admin's email, for audit). |
| POST | `/admin/requirements/{id}/reject` | `draft` → `deprecated`. Body: `{"reason": "..."}` (required — audit trail). |

Both `approve`/`reject` return `409` if the requirement isn't currently
reviewable (e.g. already `active`/`deprecated`), `404` if it doesn't exist.

```ts
Requirement = {
  id: uuid, requirement_key: string,           // "{standard}:{native_code}"
  standard: string, native_code: string, version: string,
  title: string, text: string, section_ref: string|null,
  applies_to: { sectors, operating_countries, export_regions, certifications },
  check_kind: "document_presence"|"deterministic"|"llm",
  check_code: string|null,                     // required if check_kind="deterministic"
  expected_evidence: { document_types: string[], hint: string|null },
  criticality: "core"|"mandatory"|"improvement",
  due_year: number|null,                        // null = due immediately
  status: "draft"|"active"|"deprecated",
  reviewed_by: string|null, reviewed_at: string|null, rejection_reason: string|null,
  source_id: uuid|null, regulatory_text_id: uuid|null,
  created_at: string, superseded_at: string|null
}
```

### Knowledge sources (`/api/v1/admin/sources`) — populate the catalog

This is the app's front door to register a regulation and kick off ingestion —
there is no other way in.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/sources?active=&standard=&source_type=` | List sources, filterable. |
| POST | `/admin/sources` | Register a URL-located source (`KnowledgeSourceCreate`). |
| POST | `/admin/sources/pdf` | Register an uploaded PDF (multipart: `file`, `name`, plus scoping fields). |
| GET | `/admin/sources/{id}` | One source. |
| PATCH | `/admin/sources/{id}` | Update metadata/scoping (`KnowledgeSourceUpdate`). Set `applies_to_locked: true` to stop future re-ingestions from overwriting a manual scoping correction with fresh AI inference. |
| POST | `/admin/sources/{id}/activate` / `/deactivate` | Toggle whether the source is used in analysis. |
| POST | `/admin/sources/{id}/ingest?deep=` | **Enqueue** ingestion (scrape → text → requirement extraction). Returns `202` immediately — this is slow (Playwright-backed), never blocks the request. |
| GET | `/admin/sources/{id}/ingest-status` | `{last_scraped_at, last_scrape_error}` — poll after triggering ingestion. |
| GET | `/admin/sources/{id}/texts?text_id=&offset=&limit=` | Version history (`content_hash` + `scraped_at` per version) + the content of one version (latest by default), paginated by character offset for large standards. |
| GET | `/admin/sources/monitoring` | `{total, active, inactive, sources: [{id, name, is_active, scrape_frequency, last_scraped_at, last_scrape_error}]}` — a sources-health dashboard view. |
| GET | `/admin/sources/vocabulary` | `{source_types, scrape_frequencies, applies_to}` — dropdown options for the create/edit form. |

```ts
KnowledgeSourceCreate = {
  name: string,
  url?: string,              // XOR storage_path — one is required
  storage_path?: string,
  source_type: "pdf"|"webpage"|"rss_feed",
  sectors?: string[], operating_countries?: string[], export_regions?: string[],
  certifications?: string[],
  scrape_frequency?: "daily"|"weekly"|"monthly",   // default "monthly"
  deep_crawl?: boolean                              // default false
}

KnowledgeSource = {
  id: uuid, name: string, url: string|null, storage_path: string|null,
  source_type, sectors, operating_countries, export_regions, certifications,
  scrape_frequency, deep_crawl: boolean, applies_to_locked: boolean,
  last_scrape_error: string|null, last_scraped_at: string|null,
  is_active: boolean, created_at: string
}
```

### Typical flow your UI should support: adding a new regulation

1. `POST /admin/sources` (or `/pdf`) to register it.
2. `POST /admin/sources/{id}/ingest` to scrape + extract requirements.
3. Poll `GET /admin/sources/{id}/ingest-status` until `last_scraped_at` advances
   (or `last_scrape_error` is set — surface it as-is, it's a structured message,
   never a raw 500).
4. Once ingested, new rows appear in `GET /admin/requirements?status_filter=draft`
   — the founder reviews and approves/rejects them there.
5. Approved requirements are immediately live for every customer in scope —
   make the approve action feel appropriately weighty in the UI.
