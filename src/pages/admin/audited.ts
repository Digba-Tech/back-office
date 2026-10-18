// Spread into any useQuery that hits /admin/customers/*.
//
// Every call to that family writes an immutable row to `admin_access_log`,
// and the gate runs before the route body, so even a 404 is recorded
// (metrics guide §2, §8.8). The audit trail answers "who at Digba looked at
// our data" — a question a customer under EUDR scrutiny will eventually
// ask — and it only answers it while the entries are all deliberate human
// views. A dashboard polling every 30 seconds writes 2,880 rows a day and
// buries the one that mattered.
//
// Aggregates for charts and counts come from /admin/metrics/usage, whose
// `companies[]` carries names and counts but no tenant content and is not
// audited. This file is for the drill-down a human clicked into.
export const auditedQueryOptions = {
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  staleTime: 5 * 60_000,
  // The client default is `retry: 1`, which would silently double the audit
  // rows for every transient failure.
  retry: false,
} as const
