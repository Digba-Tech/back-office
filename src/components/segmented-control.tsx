import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string> = { value: T; label: string }

// Shared "segmented pill" control: navy-filled active / white-outline
// inactive. Used for both filter bars and closed-enum form fields (Type,
// Scrape frequency, Check kind, Criticality) per the brief.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="group" className={cn("inline-flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-navy text-white"
                : "border border-line bg-background text-ink-500 hover:border-ink-400 hover:text-ink-700"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
