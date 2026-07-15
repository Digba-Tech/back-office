import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminApi } from "@/lib/api"
import type {
  Requirement,
  RequirementEdit,
  RequirementWithCitation,
} from "@/lib/types"

export type RequirementsFilters = {
  standard?: string
  status_filter?: string
}

export const requirementsKeys = {
  all: ["requirements"] as const,
  list: (filters: RequirementsFilters) =>
    ["requirements", "list", filters] as const,
  detail: (id: string) => ["requirements", "detail", id] as const,
}

export function useRequirementsList(filters: RequirementsFilters) {
  return useQuery({
    queryKey: requirementsKeys.list(filters),
    queryFn: () =>
      adminApi.get<Requirement[]>(
        `/api/v1/admin/requirements${adminApi.query(filters)}`
      ),
  })
}

export function useRequirement(id: string) {
  return useQuery({
    queryKey: requirementsKeys.detail(id),
    queryFn: () =>
      adminApi.get<RequirementWithCitation>(`/api/v1/admin/requirements/${id}`),
    enabled: !!id,
  })
}

export function useUpdateRequirement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RequirementEdit) =>
      adminApi.patch<Requirement>(`/api/v1/admin/requirements/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementsKeys.detail(id) })
      qc.invalidateQueries({ queryKey: requirementsKeys.all })
    },
  })
}

export function useApproveRequirement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      adminApi.post(`/api/v1/admin/requirements/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementsKeys.detail(id) })
      qc.invalidateQueries({ queryKey: requirementsKeys.all })
    },
  })
}

export function useRejectRequirement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) =>
      adminApi.post(`/api/v1/admin/requirements/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requirementsKeys.detail(id) })
      qc.invalidateQueries({ queryKey: requirementsKeys.all })
    },
  })
}
