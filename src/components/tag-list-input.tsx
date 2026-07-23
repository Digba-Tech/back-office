import * as React from "react"
import { useTranslation } from "react-i18next"

import { InfoTooltip } from "@/components/info-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type TagListInputProps = {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  options?: string[]
  info?: React.ReactNode
}

// Free-text tags with click-to-add suggestions from the vocabulary endpoint.
// Stands in for a full multi-select combobox — good enough for scoping
// fields (sectors, countries, regions, certifications) until that's needed.
export function TagListInput({ label, value, onChange, options, info }: TagListInputProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState("")

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
  }

  function removeTag(tag: string) {
    onChange(value.filter((existing) => existing !== tag))
  }

  const suggestions = options?.filter((option) => !value.includes(option))

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {info && <InfoTooltip>{info}</InfoTooltip>}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              title={t("tagListInput.clickToRemove")}
              className="inline-flex h-7 items-center rounded-full border border-primary bg-green-tint px-3 text-xs font-medium text-primary"
            >
              {tag} ×
            </button>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            addTag(draft)
            setDraft("")
          }
        }}
        placeholder={t("tagListInput.placeholder")}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => addTag(option)}
              title={t("tagListInput.clickToAdd")}
              className={cn(
                "inline-flex h-7 items-center rounded-full border border-line bg-background px-3 text-xs font-medium text-navy",
                "hover:border-ink-400"
              )}
            >
              + {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
