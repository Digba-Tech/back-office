import { cn } from "@/lib/utils"

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  tone?: "default" | "positive"
}) {
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
    </div>
  )
}
