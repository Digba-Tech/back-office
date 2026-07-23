import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { InfoTooltip, LabelWithInfo } from "@/components/info-tooltip"
import { SegmentedControl } from "@/components/segmented-control"
import { ActiveStatusBadge, SourceTypeBadge } from "@/components/status-badge"
import { TagListInput } from "@/components/tag-list-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ScrapeFrequency } from "@/lib/types"
import {
  sourcesKeys,
  useForceExtractRequirements,
  useIngestStatus,
  useSetSourceActive,
  useSource,
  useSourcesVocabulary,
  useSourceTexts,
  useTriggerIngest,
  useUpdateSource,
} from "./queries"

// ~15 minutes at the 5s poll interval (see useIngestStatus) — a soft cap so a
// run that never reports a distinguishable change (e.g. the same failure
// twice in a row) doesn't poll forever. Some ingestion jobs (deep crawls,
// large PDFs) legitimately take a long time, so this errs generous.
const MAX_POLL_ATTEMPTS = 180

export function SourceDetail() {
  const { t, i18n } = useTranslation()
  const { id = "" } = useParams()
  const qc = useQueryClient()
  const source = useSource(id)
  const vocabulary = useSourcesVocabulary()
  const setActive = useSetSourceActive(id)
  const triggerIngest = useTriggerIngest(id)
  const forceExtract = useForceExtractRequirements(id)
  const updateSource = useUpdateSource(id)

  const [polling, setPolling] = React.useState(false)
  const ingestStatus = useIngestStatus(id, { poll: polling })
  const [deepIngest, setDeepIngest] = React.useState(false)

  // Snapshot of ingest-status right before triggering a run — re-ingesting a
  // source that already has a last_scraped_at/last_scrape_error would
  // otherwise look "done" on the very first poll tick, before the new run
  // has actually finished (a real risk in prod's async queue mode; masked
  // locally only because inline mode blocks until the job completes).
  // Comparing against this baseline instead of a bare truthy check is what
  // actually tells "old result" apart from "new result".
  const ingestBaselineRef = React.useRef<{
    last_scraped_at: string | null
    last_scrape_error: string | null
  } | null>(null)
  const pollAttemptsRef = React.useRef(0)
  const [pollTimedOut, setPollTimedOut] = React.useState(false)

  const [selectedTextId, setSelectedTextId] = React.useState<string | undefined>()
  const texts = useSourceTexts(id, { text_id: selectedTextId })

  // Stop auto-polling once the current run's outcome actually differs from
  // the pre-trigger baseline, and refresh the source record + version
  // history so it shows up — this effect is the only place that knows the
  // run finished, since inline job execution (dev) can complete before the
  // mutation's own onSuccess fires and queue mode (prod) only surfaces
  // completion through this poll. dataUpdatedAt (not just data) is in the
  // deps so this still runs on every poll tick even when the fetched value
  // is unchanged — TanStack Query's structural sharing would otherwise keep
  // the same `data` reference and skip the effect, breaking attempt counting.
  React.useEffect(() => {
    if (!polling) return
    const baseline = ingestBaselineRef.current
    if (!baseline) return
    const current = ingestStatus.data
    if (
      current &&
      (current.last_scraped_at !== baseline.last_scraped_at ||
        current.last_scrape_error !== baseline.last_scrape_error)
    ) {
      setPolling(false)
      ingestBaselineRef.current = null
      pollAttemptsRef.current = 0
      qc.invalidateQueries({ queryKey: sourcesKeys.detail(id) })
      // Partial key (no text_id) so it matches useSourceTexts regardless of
      // which version, if any, is currently selected.
      qc.invalidateQueries({ queryKey: ["sources", "texts", id] })
      return
    }

    pollAttemptsRef.current += 1
    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setPolling(false)
      ingestBaselineRef.current = null
      pollAttemptsRef.current = 0
      setPollTimedOut(true)
    }
  }, [polling, ingestStatus.data, ingestStatus.dataUpdatedAt, qc, id])

  if (source.isLoading) return <Skeleton className="h-64 w-full" />
  if (source.error || !source.data) {
    return (
      <p className="text-destructive text-sm">
        {t("sources.detail.loadFailed", { message: source.error?.message })}
      </p>
    )
  }

  const data = source.data

  async function onTriggerIngest() {
    ingestBaselineRef.current = {
      last_scraped_at: data.last_scraped_at,
      last_scrape_error: data.last_scrape_error,
    }
    pollAttemptsRef.current = 0
    setPollTimedOut(false)
    await triggerIngest.mutateAsync(deepIngest)
    setPolling(true)
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-navy">{data.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <SourceTypeBadge type={data.source_type} />
            <ActiveStatusBadge active={data.is_active} />
            {data.applies_to_locked && (
              <Badge variant="outline">{t("sources.detail.scopingLocked")}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InfoTooltip>
            {data.is_active
              ? t("sources.detail.deactivateInfo")
              : t("sources.detail.activateInfo")}
          </InfoTooltip>
          <Button
            variant={data.is_active ? "destructive-outline" : "default"}
            disabled={setActive.isPending}
            onClick={() => setActive.mutate(!data.is_active)}
          >
            {data.is_active ? t("sources.detail.deactivate") : t("sources.detail.activate")}
          </Button>
        </div>
      </div>

      {data.last_scrape_error && (
        <Alert variant="destructive">
          <AlertTitle>{t("sources.detail.lastScrapeFailedTitle")}</AlertTitle>
          <AlertDescription>{data.last_scrape_error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-navy">
        <CardHeader>
          <CardTitle className="font-mono text-xs tracking-wide text-navy uppercase">
            {t("sources.detail.ingestionCard")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-ink-500">
            {t("sources.detail.lastScrapedLabel")}{" "}
            {data.last_scraped_at
              ? formatDateTime(data.last_scraped_at, i18n.language)
              : t("sources.list.never")}
          </p>
          <div className="flex items-center gap-3">
            <Checkbox
              id="deep_ingest"
              checked={deepIngest}
              onCheckedChange={(checked) => setDeepIngest(checked === true)}
            />
            <LabelWithInfo
              htmlFor="deep_ingest"
              info={t("sources.detail.deepCrawlThisRun.info")}
            >
              {t("sources.detail.deepCrawlThisRun.label")}
            </LabelWithInfo>
            <Button
              onClick={onTriggerIngest}
              disabled={triggerIngest.isPending || polling}
            >
              {polling ? t("sources.detail.ingesting") : t("sources.detail.runIngestion")}
            </Button>
            <InfoTooltip>{t("sources.detail.runIngestionInfo")}</InfoTooltip>
          </div>
          {polling && (
            <p className="text-sm text-ink-500">{t("sources.detail.pollingNote")}</p>
          )}
          {pollTimedOut && (
            <p className="text-sm text-ink-500">{t("sources.detail.pollTimedOut")}</p>
          )}

          <Separator />

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={forceExtract.isPending || data.certifications.length === 0}
              onClick={() => forceExtract.mutate()}
              title={
                data.certifications.length === 0
                  ? t("sources.detail.forceExtractNoCertification")
                  : undefined
              }
            >
              {forceExtract.isPending
                ? t("sources.detail.forceExtracting")
                : t("sources.detail.forceExtract")}
            </Button>
            <InfoTooltip>
              {data.certifications.length === 0
                ? t("sources.detail.forceExtractNoCertification")
                : t("sources.detail.forceExtractInfo")}
            </InfoTooltip>
          </div>
          {forceExtract.isSuccess && (
            <p className="text-sm text-ink-500">{t("sources.detail.forceExtractQueued")}</p>
          )}
          {forceExtract.error && (
            <p className="text-destructive text-sm">
              {t("sources.detail.forceExtractFailed", {
                message: forceExtract.error.message,
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sources.detail.editCard")}</CardTitle>
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
          <CardTitle>{t("sources.detail.versionHistoryCard")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {texts.isLoading && <Skeleton className="h-24 w-full" />}
          {texts.error && (
            <p className="text-destructive text-sm">
              {t("sources.detail.loadTextsFailed", { message: texts.error.message })}
            </p>
          )}
          {texts.data && texts.data.history.length === 0 && (
            <p className="text-sm text-ink-500">{t("sources.detail.noIngestedText")}</p>
          )}
          {texts.data && texts.data.history.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {texts.data.history.map((version) => {
                  const isSelected = version.id === texts.data?.text_id
                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setSelectedTextId(version.id)}
                      title={version.content_hash}
                      className={cn(
                        "h-7 rounded-full px-3 font-mono text-xs font-medium whitespace-nowrap transition-colors",
                        isSelected
                          ? "bg-navy text-white"
                          : "border border-line bg-background text-ink-500 hover:border-ink-400 hover:text-ink-700"
                      )}
                    >
                      {formatDateTime(version.scraped_at, i18n.language)}
                    </button>
                  )
                })}
              </div>
              <Separator />
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {texts.data.content}
                {texts.data.truncated && "…"}
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
  const { t } = useTranslation()
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
      setError(err instanceof Error ? err.message : t("sources.detail.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-name">{t("sources.fields.name.label")}</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {source.url !== null && (
        <div className="grid gap-2">
          <Label htmlFor="edit-url">{t("sources.fields.url.label")}</Label>
          <Input id="edit-url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      )}
      <div className="grid gap-2">
        <LabelWithInfo info={t("sources.fields.scrapeFrequency.info")}>
          {t("sources.fields.scrapeFrequency.label")}
        </LabelWithInfo>
        <SegmentedControl
          value={scrapeFrequency}
          onChange={(v) => setScrapeFrequency(v as ScrapeFrequency)}
          options={(vocabulary?.scrape_frequencies ?? [
            "daily",
            "weekly",
            "monthly",
          ]).map((freq) => ({ value: freq, label: t(`enums.scrapeFrequency.${freq}`) }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-deep-crawl"
          checked={deepCrawl}
          onCheckedChange={(checked) => setDeepCrawl(checked === true)}
        />
        <LabelWithInfo
          htmlFor="edit-deep-crawl"
          info={t("sources.fields.deepCrawl.info")}
        >
          {t("sources.fields.deepCrawl.label")}
        </LabelWithInfo>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-locked"
          checked={appliesToLocked}
          onCheckedChange={(checked) => setAppliesToLocked(checked === true)}
        />
        <LabelWithInfo
          htmlFor="edit-locked"
          info={t("sources.detail.lockScoping.info")}
        >
          {t("sources.detail.lockScoping.label")}
        </LabelWithInfo>
      </div>

      <TagListInput
        label={t("sources.fields.sectors.label")}
        value={sectors}
        onChange={setSectors}
        options={vocabulary?.applies_to.sectors}
        info={t("sources.fields.sectors.info")}
      />
      <TagListInput
        label={t("sources.fields.operatingCountries.label")}
        value={operatingCountries}
        onChange={setOperatingCountries}
        options={vocabulary?.applies_to.operating_countries}
        info={t("sources.fields.operatingCountries.info")}
      />
      <TagListInput
        label={t("sources.fields.exportRegions.label")}
        value={exportRegions}
        onChange={setExportRegions}
        options={vocabulary?.applies_to.export_regions}
        info={t("sources.fields.exportRegions.info")}
      />
      <TagListInput
        label={t("sources.fields.certifications.label")}
        value={certifications}
        onChange={setCertifications}
        options={vocabulary?.applies_to.certifications}
        info={t("sources.fields.certifications.info")}
      />

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="outline-navy" disabled={saving} className="w-fit">
        {saving ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  )
}
