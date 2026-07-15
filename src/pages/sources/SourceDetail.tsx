import * as React from "react"
import { useParams } from "react-router-dom"

import { TagListInput } from "@/components/tag-list-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import type { ScrapeFrequency } from "@/lib/types"
import {
  useIngestStatus,
  useSetSourceActive,
  useSource,
  useSourcesVocabulary,
  useSourceTexts,
  useTriggerIngest,
  useUpdateSource,
} from "./queries"

export function SourceDetail() {
  const { id = "" } = useParams()
  const source = useSource(id)
  const vocabulary = useSourcesVocabulary()
  const setActive = useSetSourceActive(id)
  const triggerIngest = useTriggerIngest(id)
  const updateSource = useUpdateSource(id)

  const [polling, setPolling] = React.useState(false)
  const ingestStatus = useIngestStatus(id, { poll: polling })
  const [deepIngest, setDeepIngest] = React.useState(false)

  const [selectedTextId, setSelectedTextId] = React.useState<string | undefined>()
  const texts = useSourceTexts(id, { text_id: selectedTextId })

  // Stop auto-polling once the backend reports a result for this run.
  React.useEffect(() => {
    if (!polling) return
    if (ingestStatus.data?.last_scrape_error || ingestStatus.data?.last_scraped_at) {
      setPolling(false)
    }
  }, [polling, ingestStatus.data])

  if (source.isLoading) return <Skeleton className="h-64 w-full" />
  if (source.error || !source.data) {
    return (
      <p className="text-destructive text-sm">
        Failed to load source: {source.error?.message}
      </p>
    )
  }

  const data = source.data

  async function onTriggerIngest() {
    await triggerIngest.mutateAsync(deepIngest)
    setPolling(true)
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{data.source_type}</Badge>
            <Badge variant={data.is_active ? "default" : "secondary"}>
              {data.is_active ? "Active" : "Inactive"}
            </Badge>
            {data.applies_to_locked && <Badge variant="outline">Scoping locked</Badge>}
          </div>
        </div>
        <Button
          variant="outline"
          disabled={setActive.isPending}
          onClick={() => setActive.mutate(!data.is_active)}
        >
          {data.is_active ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {data.last_scrape_error && (
        <Alert variant="destructive">
          <AlertTitle>Last scrape failed</AlertTitle>
          <AlertDescription>{data.last_scrape_error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingestion</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            Last scraped:{" "}
            {data.last_scraped_at
              ? new Date(data.last_scraped_at).toLocaleString()
              : "Never"}
          </p>
          <div className="flex items-center gap-3">
            <Checkbox
              id="deep_ingest"
              checked={deepIngest}
              onCheckedChange={(checked) => setDeepIngest(checked === true)}
            />
            <Label htmlFor="deep_ingest">Deep crawl this run</Label>
            <Button
              onClick={onTriggerIngest}
              disabled={triggerIngest.isPending || polling}
            >
              {polling ? "Ingesting…" : "Run ingestion"}
            </Button>
          </div>
          {polling && (
            <p className="text-muted-foreground text-sm">
              Polling ingest-status every 5s — this runs a headless browser,
              it can take a while.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceEditForm
            key={data.id}
            source={data}
            vocabulary={vocabulary.data}
            onSave={(body) => updateSource.mutateAsync(body)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version history</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {texts.isLoading && <Skeleton className="h-24 w-full" />}
          {texts.data && (
            <>
              <div className="flex flex-wrap gap-2">
                {texts.data.versions.map((version) => (
                  <Button
                    key={version.id}
                    size="sm"
                    variant={version.id === texts.data?.text_id ? "default" : "outline"}
                    onClick={() => setSelectedTextId(version.id)}
                    title={version.content_hash}
                  >
                    {new Date(version.scraped_at).toLocaleString()}
                  </Button>
                ))}
              </div>
              <Separator />
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {texts.data.content}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SourceEditForm({
  source,
  vocabulary,
  onSave,
}: {
  source: NonNullable<ReturnType<typeof useSource>["data"]>
  vocabulary: ReturnType<typeof useSourcesVocabulary>["data"]
  onSave: (
    body: Parameters<ReturnType<typeof useUpdateSource>["mutateAsync"]>[0]
  ) => Promise<unknown>
}) {
  const [name, setName] = React.useState(source.name)
  const [url, setUrl] = React.useState(source.url ?? "")
  const [scrapeFrequency, setScrapeFrequency] = React.useState<ScrapeFrequency>(
    source.scrape_frequency
  )
  const [deepCrawl, setDeepCrawl] = React.useState(source.deep_crawl)
  const [appliesToLocked, setAppliesToLocked] = React.useState(
    source.applies_to_locked
  )
  const [sectors, setSectors] = React.useState(source.sectors)
  const [operatingCountries, setOperatingCountries] = React.useState(
    source.operating_countries
  )
  const [exportRegions, setExportRegions] = React.useState(source.export_regions)
  const [certifications, setCertifications] = React.useState(source.certifications)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name,
        url: url || undefined,
        scrape_frequency: scrapeFrequency,
        deep_crawl: deepCrawl,
        applies_to_locked: appliesToLocked,
        sectors,
        operating_countries: operatingCountries,
        export_regions: exportRegions,
        certifications,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {source.url !== null && (
        <div className="grid gap-2">
          <Label htmlFor="edit-url">URL</Label>
          <Input id="edit-url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      )}
      <div className="grid gap-2">
        <Label>Scrape frequency</Label>
        <Select
          value={scrapeFrequency}
          onValueChange={(v) => setScrapeFrequency(v as ScrapeFrequency)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(vocabulary?.scrape_frequencies ?? ["daily", "weekly", "monthly"]).map(
              (freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-deep-crawl"
          checked={deepCrawl}
          onCheckedChange={(checked) => setDeepCrawl(checked === true)}
        />
        <Label htmlFor="edit-deep-crawl">Deep crawl</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-locked"
          checked={appliesToLocked}
          onCheckedChange={(checked) => setAppliesToLocked(checked === true)}
        />
        <Label htmlFor="edit-locked">
          Lock scoping (stop re-ingestion from overwriting these fields)
        </Label>
      </div>

      <TagListInput
        label="Sectors"
        value={sectors}
        onChange={setSectors}
        options={vocabulary?.applies_to.sectors}
      />
      <TagListInput
        label="Operating countries"
        value={operatingCountries}
        onChange={setOperatingCountries}
        options={vocabulary?.applies_to.operating_countries}
      />
      <TagListInput
        label="Export regions"
        value={exportRegions}
        onChange={setExportRegions}
        options={vocabulary?.applies_to.export_regions}
      />
      <TagListInput
        label="Certifications"
        value={certifications}
        onChange={setCertifications}
        options={vocabulary?.applies_to.certifications}
      />

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
