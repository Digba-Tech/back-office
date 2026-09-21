import { EmailVerificationClaim } from "supertokens-web-js/recipe/emailverification"
import { getInvalidClaimsFromResponse } from "supertokens-web-js/recipe/session"

import i18n from "@/lib/i18n"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

// A valid, verified session hit an admin-only route without the admin role
// (guide §3.3: a real authorization failure, not a claim issue — never
// retried automatically).
export class ForbiddenError extends ApiError {
  constructor(body?: unknown) {
    super(403, i18n.t("api.notAuthorized"), body)
    this.name = "ForbiddenError"
  }
}

// A valid session whose email isn't verified yet hit a session-guarded
// route (guide §3.3, the `st-ev` claim). Distinct from ForbiddenError so
// callers route to the verify-email screen instead of a dead-end.
export class EmailVerificationRequiredError extends ApiError {
  constructor(body?: unknown) {
    super(403, i18n.t("api.verificationRequired"), body)
    this.name = "EmailVerificationRequiredError"
  }
}

type Listener = () => void

const forbiddenListeners = new Set<Listener>()
const verificationRequiredListeners = new Set<Listener>()

export function onForbidden(listener: Listener): () => void {
  forbiddenListeners.add(listener)
  return () => forbiddenListeners.delete(listener)
}

export function onVerificationRequired(listener: Listener): () => void {
  verificationRequiredListeners.add(listener)
  return () => verificationRequiredListeners.delete(listener)
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>
    if (typeof record.message === "string") return record.message
    if (typeof record.detail === "string") return record.detail
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData
  if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  // Deliberately a plain fetch — src/lib/supertokens.ts's SuperTokens.init()
  // patches window.fetch globally to attach the session cookie, anti-CSRF
  // header, and silently refresh-and-retry once on a refreshable 401. A
  // manual Authorization header or a hand-rolled retry loop here would
  // fight that (guide §3.2) since apiDomain/websiteDomain are cross-origin.
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    // The interceptor already tried a silent refresh-and-retry before this
    // response reached us — surviving 401 means the session is genuinely
    // gone (guide §3.3). AuthProvider reacts to this on its own via the
    // SDK's UNAUTHORISED event (src/lib/supertokens.ts's onSessionEnded);
    // this just surfaces a translated error to the caller.
    throw new ApiError(401, i18n.t("api.sessionExpired"))
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => undefined)
    const claimErrors = await getInvalidClaimsFromResponse({
      response: { data: body },
    }).catch(() => [])

    if (claimErrors.some((err) => err.id === EmailVerificationClaim.id)) {
      verificationRequiredListeners.forEach((listen) => listen())
      throw new EmailVerificationRequiredError(body)
    }

    forbiddenListeners.forEach((listen) => listen())
    throw new ForbiddenError(body)
  }

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = undefined
    }
    throw new ApiError(
      res.status,
      extractMessage(body, i18n.t("api.requestFailed", { status: res.status })),
      body
    )
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: json !== undefined ? JSON.stringify(json) : undefined,
    }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  patch: <T>(path: string, json: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(json) }),
  query,
}
