import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const STATUS_VARIANT = {
  draft: "secondary",
  active: "default",
  deprecated: "outline",
} as const

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
      <h1 className="text-xl font-semibold">{t("requirements.list.title")}</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t("requirements.list.filterDraft")}</SelectItem>
            <SelectItem value="active">{t("requirements.list.filterActive")}</SelectItem>
            <SelectItem value="deprecated">
              {t("requirements.list.filterDeprecated")}
            </SelectItem>
            <SelectItem value="all">{t("requirements.list.filterAll")}</SelectItem>
          </SelectContent>
        </Select>

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
                    className="font-medium hover:underline"
                  >
                    {req.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {req.standard} · {req.native_code}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`enums.criticality.${req.criticality}`)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {req.due_year ?? t("requirements.list.dueImmediate")}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {t(`enums.requirementStatus.${req.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {requirements.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
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
