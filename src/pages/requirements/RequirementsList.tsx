import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { SegmentedControl } from "@/components/segmented-control"
import { CriticalityBadge, RequirementStatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useRequirementsList } from "./queries"

export function RequirementsList() {
  const { t } = useTranslation()
  const [standard, setStandard] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("draft")

  const requirements = useRequirementsList({
    standard: standard || undefined,
    status_filter: statusFilter === "all" ? undefined : statusFilter,
  })

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-2xl text-navy">{t("requirements.list.title")}</h1>

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "draft", label: t("requirements.list.filterDraft") },
            { value: "active", label: t("requirements.list.filterActive") },
            { value: "deprecated", label: t("requirements.list.filterDeprecated") },
            { value: "all", label: t("requirements.list.filterAll") },
          ]}
        />

        <Input
          placeholder={t("requirements.list.standardPlaceholder")}
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="w-56"
        />
      </div>

      {requirements.isLoading && <Skeleton className="h-40 w-full" />}

      {requirements.error && (
        <p className="text-destructive text-sm">
          {t("requirements.list.loadFailed", { message: requirements.error.message })}
        </p>
      )}

      {requirements.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("requirements.list.colTitle")}</TableHead>
              <TableHead>{t("requirements.list.colStandard")}</TableHead>
              <TableHead>{t("requirements.list.colCriticality")}</TableHead>
              <TableHead>{t("requirements.list.colDueYear")}</TableHead>
              <TableHead>{t("requirements.list.colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.data.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <Link
                    to={`/requirements/${req.id}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {req.title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm text-ink-500">
                  {req.standard} · {req.native_code}
                </TableCell>
                <TableCell>
                  <CriticalityBadge criticality={req.criticality} />
                </TableCell>
                <TableCell className="font-mono text-sm text-ink-500">
                  {req.due_year ?? t("requirements.list.dueImmediate")}
                </TableCell>
                <TableCell>
                  <RequirementStatusBadge status={req.status} />
                </TableCell>
              </TableRow>
            ))}
            {requirements.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-ink-500">
                  {t("requirements.list.emptyFiltered")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
