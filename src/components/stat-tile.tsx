import * as React from "react"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Direction and judgement are separate props on purpose: a rising cost and
 * a rising signup count are both "up", and only one of them is good news.
 * The arrow carries the direction, the colour carries the judgement, and
 * the caller — which knows what the metric means — decides.
 *
 * Colour is never the only signal (metrics guide §5): the arrow ships with
 * it, and `deltaLabel` says what the comparison is against.
 */
type Trend = "up" | "down" | "flat"
type Sentiment = "good" | "bad" | "neutral"

const TREND_ICON: Record<Trend, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
}

const SENTIMENT_CLASS: Record<Sentiment, string> = {
  good: "text-primary",
  bad: "text-destructive",
  neutral: "text-ink-500",
}

export function StatTile({
  label,
  value,
  tone = "default",
  delta,
  deltaTrend = "flat",
  deltaSentiment = "neutral",
  deltaLabel,
  caption,
}: {
  label: string
  /** Pass a formatted string — the formatters render a missing value as "—", never 0. */
  value: React.ReactNode
  tone?: "default" | "positive"
  /** Preformatted, e.g. "+12%" or "+$4.10". Omit when there is nothing to compare against. */
  delta?: React.ReactNode
  deltaTrend?: Trend
  deltaSentiment?: Sentiment
  /** What the delta is measured against, e.g. "vs. previous 30 days". */
  deltaLabel?: string
  /** A caveat that belongs with the number, e.g. "partial — 3 calls unpriced". */
  caption?: React.ReactNode
}) {
  const TrendIcon = TREND_ICON[deltaTrend]

  return (
    <div className="rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]">
      <p className="font-mono text-[11px] font-medium tracking-wide text-ink-400 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-heading text-[28px] leading-tight font-semibold",
          tone === "positive" ? "text-primary" : "text-navy"
        )}
      >
        {value}
      </p>
      {delta !== undefined && delta !== null ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-[12px] font-medium",
            SENTIMENT_CLASS[deltaSentiment]
          )}
        >
          <TrendIcon aria-hidden="true" className="size-3.5" />
          <span>{delta}</span>
          {deltaLabel ? (
            <span className="font-normal text-ink-400">{deltaLabel}</span>
          ) : null}
        </p>
      ) : null}
      {caption ? (
        <p className="mt-1 text-[12px] leading-relaxed text-ink-400">{caption}</p>
      ) : null}
    </div>
  )
}
