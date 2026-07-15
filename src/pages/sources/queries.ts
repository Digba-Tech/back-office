import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminApi } from "@/lib/api"
import type {
  IngestStatus,
  KnowledgeSource,
  KnowledgeSourceCreate,
  KnowledgeSourceUpdate,
  SourcesMonitoring,
  SourcesVocabulary,
  SourceTexts,
} from "@/lib/types"

export type SourcesFilters = {
  active?: string
  standard?: string
  source_type?: string
}

export const sourcesKeys = {
  all: ["sources"] as const,
  list: (filters: SourcesFilters) => ["sources", "list", filters] as const,
  detail: (id: string) => ["sources", "detail", id] as const,
  ingestStatus: (id: string) => ["sources", "ingest-status", id] as const,
  monitoring: ["sources", "monitoring"] as const,
  vocabulary: ["sources", "vocabulary"] as const,
  texts: (id: string, textId?: string) =>
    ["sources", "texts", id, textId] as const,
}

export function useSourcesList(filters: SourcesFilters) {
  return useQuery({
    queryKey: sourcesKeys.list(filters),
    queryFn: () =>
      adminApi.get<KnowledgeSource[]>(
        `/api/v1/admin/sources${adminApi.query(filters)}`
      ),
  })
}

export function useSource(id: string) {
  return useQuery({
    queryKey: sourcesKeys.detail(id),
    queryFn: () => adminApi.get<KnowledgeSource>(`/api/v1/admin/sources/${id}`),
    enabled: !!id,
  })
}

export function useSourcesMonitoring() {
  return useQuery({
    queryKey: sourcesKeys.monitoring,
    queryFn: () =>
      adminApi.get<SourcesMonitoring>("/api/v1/admin/sources/monitoring"),
  })
}

export function useSourcesVocabulary() {
  return useQuery({
    queryKey: sourcesKeys.vocabulary,
    queryFn: () =>
      adminApi.get<SourcesVocabulary>("/api/v1/admin/sources/vocabulary"),
    staleTime: Infinity,
  })
}

export function useIngestStatus(id: string, { poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: sourcesKeys.ingestStatus(id),
    queryFn: () =>
      adminApi.get<IngestStatus>(`/api/v1/admin/sources/${id}/ingest-status`),
    enabled: !!id,
    refetchInterval: poll ? 5000 : false,
  })
}

export function useSourceTexts(
  id: string,
  params: { text_id?: string; offset?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: sourcesKeys.texts(id, params.text_id),
    queryFn: () =>
      adminApi.get<SourceTexts>(
        `/api/v1/admin/sources/${id}/texts${adminApi.query(params)}`
      ),
    enabled: !!id,
  })
}

export function useCreateSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: KnowledgeSourceCreate) =>
      adminApi.post<KnowledgeSource>("/api/v1/admin/sources", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKeys.all }),
  })
}

export function useCreateSourcePdf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) =>
      adminApi.postForm<KnowledgeSource>("/api/v1/admin/sources/pdf", form),
    onSuccess: () => qc.invalidateQueries({ queryKey: sourcesKeys.all }),
  })
}

export function useUpdateSource(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: KnowledgeSourceUpdate) =>
      adminApi.patch<KnowledgeSource>(`/api/v1/admin/sources/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sourcesKeys.detail(id) })
      qc.invalidateQueries({ queryKey: sourcesKeys.all })
    },
  })
}

export function useSetSourceActive(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (activate: boolean) =>
      adminApi.post(
        `/api/v1/admin/sources/${id}/${activate ? "activate" : "deactivate"}`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sourcesKeys.detail(id) })
      qc.invalidateQueries({ queryKey: sourcesKeys.all })
    },
  })
}

export function useTriggerIngest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (deep: boolean) =>
      adminApi.post(`/api/v1/admin/sources/${id}/ingest${adminApi.query({ deep })}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: sourcesKeys.ingestStatus(id) }),
  })
}
