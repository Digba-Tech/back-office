import * as React from "react"
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
  const [standard, setStandard] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("draft")

  const requirements = useRequirementsList({
    standard: standard || undefined,
    status_filter: statusFilter === "all" ? undefined : statusFilter,
  })

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Requirements review</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Needs review (draft)</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by standard…"
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="w-56"
        />
      </div>

      {requirements.isLoading && <Skeleton className="h-40 w-full" />}

      {requirements.error && (
        <p className="text-destructive text-sm">
          Failed to load requirements: {requirements.error.message}
        </p>
      )}

      {requirements.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Standard</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Due year</TableHead>
              <TableHead>Status</TableHead>
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
                  <Badge variant="outline">{req.criticality}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {req.due_year ?? "Immediate"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[req.status]}>{req.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {requirements.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No requirements match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
