import * as React from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

import { useSourcesList, useSourcesMonitoring, useSourcesVocabulary } from "./queries"

export function SourcesList() {
  const [active, setActive] = React.useState<string>("all")
  const [standard, setStandard] = React.useState("")
  const [sourceType, setSourceType] = React.useState<string>("all")

  const vocabulary = useSourcesVocabulary()
  const monitoring = useSourcesMonitoring()
  const sources = useSourcesList({
    active: active === "all" ? undefined : active,
    standard: standard || undefined,
    source_type: sourceType === "all" ? undefined : sourceType,
  })

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Knowledge sources</h1>
        <Button asChild>
          <Link to="/sources/new">New source</Link>
        </Button>
      </div>

      {monitoring.data && (
        <div className="grid grid-cols-3 gap-4">
          <MonitoringStat label="Total" value={monitoring.data.total} />
          <MonitoringStat label="Active" value={monitoring.data.active} />
          <MonitoringStat label="Inactive" value={monitoring.data.inactive} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={active} onValueChange={setActive}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active only</SelectItem>
            <SelectItem value="false">Inactive only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {vocabulary.data?.source_types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by standard…"
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="w-56"
        />
      </div>

      {sources.isLoading && <Skeleton className="h-40 w-full" />}

      {sources.error && (
        <p className="text-destructive text-sm">
          Failed to load sources: {sources.error.message}
        </p>
      )}

      {sources.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last scraped</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.data.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <Link
                    to={`/sources/${source.id}`}
                    className="font-medium hover:underline"
                  >
                    {source.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{source.source_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={source.is_active ? "default" : "secondary"}>
                    {source.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {source.last_scraped_at
                    ? new Date(source.last_scraped_at).toLocaleString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  {source.last_scrape_error && (
                    <Badge variant="destructive" title={source.last_scrape_error}>
                      Error
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sources.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No sources match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function MonitoringStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
