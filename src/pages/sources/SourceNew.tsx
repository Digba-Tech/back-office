import * as React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { LabelWithInfo } from "@/components/info-tooltip"
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
  const { t } = useTranslation()
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
      setError(t("sources.new.errorNameRequired"))
      return
    }

    try {
      if (mode === "url") {
        if (!url.trim()) {
          setError(t("sources.new.errorUrlRequired"))
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
          setError(t("sources.new.errorFileRequired"))
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
      setError(err instanceof Error ? err.message : t("sources.new.errorFallback"))
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">{t("sources.new.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("sources.new.detailsCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("sources.fields.name.label")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("sources.new.namePlaceholder")}
              />
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "url" | "pdf")}>
              <TabsList>
                <TabsTrigger value="url">{t("sources.new.tabUrl")}</TabsTrigger>
                <TabsTrigger value="pdf">{t("sources.new.tabPdf")}</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">{t("sources.fields.url.label")}</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("sources.new.urlPlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <LabelWithInfo info={t("sources.fields.type.info")}>
                    {t("sources.fields.type.label")}
                  </LabelWithInfo>
                  <Select
                    value={urlType}
                    onValueChange={(v) => setUrlType(v as SourceType)}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        vocabulary.data?.source_types.filter(
                          (type) => type !== "pdf"
                        ) ?? (["webpage", "rss_feed"] as SourceType[])
                      ).map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`enums.sourceType.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="pdf" className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">{t("sources.new.fileLabel")}</Label>
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
              <LabelWithInfo info={t("sources.fields.scrapeFrequency.info")}>
                {t("sources.fields.scrapeFrequency.label")}
              </LabelWithInfo>
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
                      {t(`enums.scrapeFrequency.${freq}`)}
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
              <LabelWithInfo
                htmlFor="deep_crawl"
                info={t("sources.fields.deepCrawl.info")}
              >
                {t("sources.fields.deepCrawl.label")}
              </LabelWithInfo>
            </div>

            <TagListInput
              label={t("sources.fields.sectors.label")}
              value={sectors}
              onChange={setSectors}
              options={vocabulary.data?.applies_to.sectors}
              info={t("sources.fields.sectors.info")}
            />
            <TagListInput
              label={t("sources.fields.operatingCountries.label")}
              value={operatingCountries}
              onChange={setOperatingCountries}
              options={vocabulary.data?.applies_to.operating_countries}
              info={t("sources.fields.operatingCountries.info")}
            />
            <TagListInput
              label={t("sources.fields.exportRegions.label")}
              value={exportRegions}
              onChange={setExportRegions}
              options={vocabulary.data?.applies_to.export_regions}
              info={t("sources.fields.exportRegions.info")}
            />
            <TagListInput
              label={t("sources.fields.certifications.label")}
              value={certifications}
              onChange={setCertifications}
              options={vocabulary.data?.applies_to.certifications}
              info={t("sources.fields.certifications.info")}
            />

            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? t("sources.new.submitting") : t("sources.new.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
