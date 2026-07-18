import i18n from "@/lib/i18n"
import { supabase } from "@/lib/supabase"

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

// Token is valid but the account isn't flagged admin (guide §2: this is a
// backend/ops fix, never something to retry client-side).
export class ForbiddenError extends ApiError {
  constructor(body?: unknown) {
    super(403, i18n.t("api.notAuthorized"), body)
    this.name = "ForbiddenError"
  }
}

type ForbiddenListener = () => void
const forbiddenListeners = new Set<ForbiddenListener>()

export function onForbidden(listener: ForbiddenListener): () => void {
  forbiddenListeners.add(listener)
  return () => forbiddenListeners.delete(listener)
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === "string") return detail
  }
  return fallback
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { retryOn401 = true }: { retryOn401?: boolean } = {}
): Promise<T> {
  const token = await getAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const isFormData = options.body instanceof FormData
  if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && retryOn401) {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data.session) {
      return request<T>(path, options, { retryOn401: false })
    }
    await supabase.auth.signOut()
    throw new ApiError(401, i18n.t("api.sessionExpired"))
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => undefined)
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
