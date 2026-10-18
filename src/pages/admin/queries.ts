import { useQuery } from "@tanstack/react-query"

import { adminApi } from "@/lib/api"

import { auditedQueryOptions } from "./audited"
import type {
  AccessLog,
  CustomerDossier,
  DocumentProcessing,
  MetricsCosts,
  MetricsEfficacy,
  MetricsOverview,
  MetricsPipeline,
  MetricsReport,
  MetricsUsage,
} from "./types"
import type { WindowParams } from "./window"

// The /admin/metrics/* family: cross-tenant aggregates, no tenant content
// by construction, and deliberately NOT audited — a row per page load would
// drown the trail that /admin/customers/* keeps. These are therefore safe
// to cache and refetch normally; see ./audited.ts for the other family,
// which is not.
//
// No refetchInterval anywhere here: these are analytics reads behind a 30s
// statement_timeout, and nothing on these pages changes second to second.

export const metricsKeys = {
  all: ["admin", "metrics"] as const,
  overview: (w: WindowParams) => ["admin", "metrics", "overview", w] as const,
  pipeline: (w: WindowParams) => ["admin", "metrics", "pipeline", w] as const,
  costs: (w: WindowParams) => ["admin", "metrics", "costs", w] as const,
  usage: (w: WindowParams) => ["admin", "metrics", "usage", w] as const,
  efficacy: (w: WindowParams) => ["admin", "metrics", "efficacy", w] as const,
}

const STALE_TIME = 60_000

function windowQuery(w: WindowParams): string {
  return adminApi.query({ since: w.since, until: w.until })
}

export function useMetricsOverview(w: WindowParams) {
  return useQuery({
    queryKey: metricsKeys.overview(w),
    queryFn: () =>
      adminApi.get<MetricsOverview>(`/admin/metrics/overview${windowQuery(w)}`),
    staleTime: STALE_TIME,
  })
}

export function useMetricsPipeline(w: WindowParams) {
  return useQuery({
    queryKey: metricsKeys.pipeline(w),
    queryFn: () =>
      adminApi.get<MetricsPipeline>(`/admin/metrics/pipeline${windowQuery(w)}`),
    staleTime: STALE_TIME,
  })
}

export function useMetricsCosts(w: WindowParams) {
  return useQuery({
    queryKey: metricsKeys.costs(w),
    queryFn: () => adminApi.get<MetricsCosts>(`/admin/metrics/costs${windowQuery(w)}`),
    staleTime: STALE_TIME,
  })
}

export function useMetricsUsage(w: WindowParams) {
  return useQuery({
    queryKey: metricsKeys.usage(w),
    queryFn: () => adminApi.get<MetricsUsage>(`/admin/metrics/usage${windowQuery(w)}`),
    staleTime: STALE_TIME,
  })
}

export function useMetricsEfficacy(w: WindowParams) {
  return useQuery({
    queryKey: metricsKeys.efficacy(w),
    queryFn: () =>
      adminApi.get<MetricsEfficacy>(`/admin/metrics/efficacy${windowQuery(w)}`),
    staleTime: STALE_TIME,
  })
}

/**
 * Aggregated server-side for the month. Not composed from the daily
 * endpoints: those values are already rounded, and summing rounded numbers
 * is how a monthly figure stops matching the invoice (§8.3).
 */
export function useMetricsReport(month: string) {
  return useQuery({
    queryKey: ["admin", "metrics", "report", month] as const,
    queryFn: () =>
      adminApi.get<MetricsReport>(
        `/admin/metrics/report${adminApi.query({ month })}`
      ),
    staleTime: STALE_TIME,
  })
}

// --- The audited family ----------------------------------------------------
// Everything below writes an immutable row to admin_access_log per call,
// on a 404 as much as on a 200. auditedQueryOptions turns off every
// automatic refetch and the retry, so each row corresponds to a human
// deciding to look at something.

export const customerKeys = {
  dossier: (id: string) => ["admin", "customers", id] as const,
  processing: (id: string, documentId: string) =>
    ["admin", "customers", id, "documents", documentId] as const,
  accessLog: (id: string) => ["admin", "customers", id, "access-log"] as const,
}

export function useCustomerDossier(companyId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.dossier(companyId),
    queryFn: () => adminApi.get<CustomerDossier>(`/admin/customers/${companyId}`),
    enabled,
    ...auditedQueryOptions,
  })
}

export function useDocumentProcessing(
  companyId: string,
  documentId: string,
  enabled = true
) {
  return useQuery({
    queryKey: customerKeys.processing(companyId, documentId),
    queryFn: () =>
      adminApi.get<DocumentProcessing>(
        `/admin/customers/${companyId}/documents/${documentId}/processing`
      ),
    enabled,
    ...auditedQueryOptions,
  })
}

/**
 * Includes the request that fetched it — the gate writes before the body
 * runs, so this log always shows at least the view you are looking at.
 */
export function useAccessLog(companyId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.accessLog(companyId),
    queryFn: () => adminApi.get<AccessLog>(`/admin/customers/${companyId}/access-log`),
    enabled,
    ...auditedQueryOptions,
  })
}
