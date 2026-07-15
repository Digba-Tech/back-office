import { QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/auth/AuthProvider"
import { RequireSession } from "@/auth/RequireSession"
import { AppLayout } from "@/components/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/queryClient"
import { Login } from "@/pages/Login"
import { RequirementDetail } from "@/pages/requirements/RequirementDetail"
import { RequirementsList } from "@/pages/requirements/RequirementsList"
import { SourceDetail } from "@/pages/sources/SourceDetail"
import { SourceNew } from "@/pages/sources/SourceNew"
import { SourcesList } from "@/pages/sources/SourcesList"

export function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireSession />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/sources" replace />} />
                <Route path="sources" element={<SourcesList />} />
                <Route path="sources/new" element={<SourceNew />} />
                <Route path="sources/:id" element={<SourceDetail />} />
                <Route path="requirements" element={<RequirementsList />} />
                <Route path="requirements/:id" element={<RequirementDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}
