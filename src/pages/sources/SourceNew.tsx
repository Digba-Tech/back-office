import * as React from "react"
import { useNavigate } from "react-router-dom"

import { TagListInput } from "@/components/tag-list-input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { ScrapeFrequency, SourceType } from "@/lib/types"
import { useCreateSource, useCreateSourcePdf, useSourcesVocabulary } from "./queries"

export function SourceNew() {
  const navigate = useNavigate()
  const vocabulary = useSourcesVocabulary()
  const createSource = useCreateSource()
  const createPdf = useCreateSourcePdf()

  const [mode, setMode] = React.useState<"url" | "pdf">("url")
  const [name, setName] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [urlType, setUrlType] = React.useState<SourceType>("webpage")
  const [file, setFile] = React.useState<File | null>(null)
  const [scrapeFrequency, setScrapeFrequency] =
    React.useState<ScrapeFrequency>("monthly")
  const [deepCrawl, setDeepCrawl] = React.useState(false)
  const [sectors, setSectors] = React.useState<string[]>([])
  const [operatingCountries, setOperatingCountries] = React.useState<string[]>([])
  const [exportRegions, setExportRegions] = React.useState<string[]>([])
  const [certifications, setCertifications] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const pending = createSource.isPending || createPdf.isPending

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Name is required")
      return
    }

    try {
      if (mode === "url") {
        if (!url.trim()) {
          setError("URL is required")
          return
        }
        const created = await createSource.mutateAsync({
          name,
          url,
          source_type: urlType,
          sectors,
          operating_countries: operatingCountries,
          export_regions: exportRegions,
          certifications,
          scrape_frequency: scrapeFrequency,
          deep_crawl: deepCrawl,
        })
        navigate(`/sources/${created.id}`)
      } else {
        if (!file) {
          setError("Choose a PDF file to upload")
          return
        }
        const form = new FormData()
        form.set("file", file)
        form.set("name", name)
        sectors.forEach((s) => form.append("sectors", s))
        operatingCountries.forEach((c) => form.append("operating_countries", c))
        exportRegions.forEach((r) => form.append("export_regions", r))
        certifications.forEach((c) => form.append("certifications", c))
        form.set("scrape_frequency", scrapeFrequency)
        form.set("deep_crawl", String(deepCrawl))
        const created = await createPdf.mutateAsync(form)
        navigate(`/sources/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create source")
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Register a new source</h1>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. EU REACH Regulation"
              />
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "url" | "pdf")}>
              <TabsList>
                <TabsTrigger value="url">URL-located source</TabsTrigger>
                <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={urlType}
                    onValueChange={(v) => setUrlType(v as SourceType)}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vocabulary.data?.source_types
                        .filter((t) => t !== "pdf")
                        .map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        )) ?? (
                        <>
                          <SelectItem value="webpage">webpage</SelectItem>
                          <SelectItem value="rss_feed">rss_feed</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="pdf" className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">PDF file</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </TabsContent>
            </Tabs>

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
                  {(vocabulary.data?.scrape_frequencies ?? [
                    "daily",
                    "weekly",
                    "monthly",
                  ]).map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="deep_crawl"
                checked={deepCrawl}
                onCheckedChange={(checked) => setDeepCrawl(checked === true)}
              />
              <Label htmlFor="deep_crawl">Deep crawl</Label>
            </div>

            <TagListInput
              label="Sectors"
              value={sectors}
              onChange={setSectors}
              options={vocabulary.data?.applies_to.sectors}
            />
            <TagListInput
              label="Operating countries"
              value={operatingCountries}
              onChange={setOperatingCountries}
              options={vocabulary.data?.applies_to.operating_countries}
            />
            <TagListInput
              label="Export regions"
              value={exportRegions}
              onChange={setExportRegions}
              options={vocabulary.data?.applies_to.export_regions}
            />
            <TagListInput
              label="Certifications"
              value={certifications}
              onChange={setCertifications}
              options={vocabulary.data?.applies_to.certifications}
            />

            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Creating…" : "Register source"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
