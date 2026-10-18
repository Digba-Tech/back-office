import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AuthProvider } from "@/auth/AuthProvider"
import { RequireSession } from "@/auth/RequireSession"
import { AppLayout } from "@/components/layout/AppLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { FACES, readLastFace } from "@/lib/faces"
import { queryClient } from "@/lib/queryClient"
import { JobsList } from "@/pages/admin/queue/JobsList"
import { RequirementDetail } from "@/pages/knowledge/requirements/RequirementDetail"
import { RequirementsList } from "@/pages/knowledge/requirements/RequirementsList"
import { SourceDetail } from "@/pages/knowledge/sources/SourceDetail"
import { SourceNew } from "@/pages/knowledge/sources/SourceNew"
import { SourcesList } from "@/pages/knowledge/sources/SourcesList"
import { Login } from "@/pages/Login"
import { VerifyEmail } from "@/pages/VerifyEmail"

// The admin face pulls in Recharts, which the knowledge face never
// renders. Splitting it here keeps that weight off the initial load for
// someone who only ever edits sources.
const Overview = React.lazy(() =>
  import("@/pages/admin/Overview").then((m) => ({ default: m.Overview }))
)

const Pipeline = React.lazy(() =>
  import("@/pages/admin/Pipeline").then((m) => ({ default: m.Pipeline }))
)

const Costs = React.lazy(() =>
  import("@/pages/admin/Costs").then((m) => ({ default: m.Costs }))
)

const Customers = React.lazy(() =>
  import("@/pages/admin/Customers").then((m) => ({ default: m.Customers }))
)

const Efficacy = React.lazy(() =>
  import("@/pages/admin/Efficacy").then((m) => ({ default: m.Efficacy }))
)

const Report = React.lazy(() =>
  import("@/pages/admin/Report").then((m) => ({ default: m.Report }))
)

const CustomerDetail = React.lazy(() =>
  import("@/pages/admin/CustomerDetail").then((m) => ({ default: m.CustomerDetail }))
)

const CustomerDocument = React.lazy(() =>
  import("@/pages/admin/CustomerDocument").then((m) => ({ default: m.CustomerDocument }))
)

// "/" resolves to whichever face this admin was last in, so someone who
// lives in the admin face doesn't pass through Sources every morning.
function FaceHome() {
  return <Navigate to={FACES[readLastFace()].home} replace />
}

// The faces were namespaced after the app had been in use, so the old
// root-level paths are live in bookmarks and in the V2 guide. Rewrite them
// rather than 404-ing: "/sources/abc" -> "/knowledge/sources/abc".
function PrefixRedirect({ from, to }: { from: string; to: string }) {
  const { pathname, search, hash } = useLocation()
  const rest = pathname.startsWith(from) ? pathname.slice(from.length) : ""
  return <Navigate to={`${to}${rest}${search}${hash}`} replace />
}

export function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route element={<RequireSession />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<FaceHome />} />

                    <Route path="knowledge">
                      <Route index element={<Navigate to="/knowledge/sources" replace />} />
                      <Route path="sources" element={<SourcesList />} />
                      <Route path="sources/new" element={<SourceNew />} />
                      <Route path="sources/:id" element={<SourceDetail />} />
                      <Route path="requirements" element={<RequirementsList />} />
                      <Route path="requirements/:id" element={<RequirementDetail />} />
                    </Route>

                    <Route path="admin">
                      <Route index element={<Navigate to="/admin/overview" replace />} />
                      <Route path="overview" element={<Overview />} />
                      {/* The system-wide task queue — every ingest_document,
                          analyze_company, ingest_source, extract_requirements,
                          gap_sweep and snapshot_readiness job lands here. It is
                          an operational surface, not a knowledge-management one,
                          which is why it sits on this face. "Queue" is now,
                          "Pipeline" is the same subject over time. */}
                      <Route path="queue" element={<JobsList />} />
                      <Route path="pipeline" element={<Pipeline />} />
                      <Route path="costs" element={<Costs />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="customers/:id" element={<CustomerDetail />} />
                      <Route
                        path="customers/:id/documents/:documentId"
                        element={<CustomerDocument />}
                      />
                      <Route path="efficacy" element={<Efficacy />} />
                      <Route path="report" element={<Report />} />
                    </Route>

                    <Route
                      path="/sources/*"
                      element={<PrefixRedirect from="/sources" to="/knowledge/sources" />}
                    />
                    <Route
                      path="/requirements/*"
                      element={
                        <PrefixRedirect from="/requirements" to="/knowledge/requirements" />
                      }
                    />
                    <Route
                      path="/jobs/*"
                      element={<PrefixRedirect from="/jobs" to="/admin/queue" />}
                    />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}
