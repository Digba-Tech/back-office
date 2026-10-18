import { useQuery } from "@tanstack/react-query"

import { adminApi } from "@/lib/api"

import type {
  MetricsCosts,
  MetricsEfficacy,
  MetricsOverview,
  MetricsPipeline,
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
