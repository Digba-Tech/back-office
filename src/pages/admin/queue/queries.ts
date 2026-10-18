import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminApi } from "@/lib/api"
import type { Job } from "@/lib/types"

export const jobsKeys = {
  all: ["jobs"] as const,
  list: (statusFilter?: string) => ["jobs", "list", statusFilter] as const,
}

// Polls by default (guide §4.3's suggested panel: "poll ... periodically") —
// jobs move through pending/running/done on their own, so the list would
// otherwise go stale the moment a background worker picks something up.
export function useJobsList(
  statusFilter?: string,
  { poll = true }: { poll?: boolean } = {}
) {
  return useQuery({
    queryKey: jobsKeys.list(statusFilter),
    queryFn: () =>
      adminApi
        .get<{ jobs: Job[] }>(
          `/admin/jobs${adminApi.query({ status_filter: statusFilter })}`
        )
        .then((res) => res.jobs),
    refetchInterval: poll ? 10000 : false,
  })
}

export function useRetryJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.post<{ job: Job }>(`/admin/jobs/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobsKeys.all }),
  })
}
