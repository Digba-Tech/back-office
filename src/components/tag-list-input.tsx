import * as React from "react"
import { useTranslation } from "react-i18next"

import { InfoTooltip } from "@/components/info-tooltip"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
              title={t("tagListInput.clickToRemove")}
            >
              {tag} ×
            </Badge>
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
        <div className="flex flex-wrap gap-1">
          {suggestions.map((option) => (
            <Badge
              key={option}
              variant="outline"
              className="cursor-pointer"
              onClick={() => addTag(option)}
              title={t("tagListInput.clickToAdd")}
            >
              + {option}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
