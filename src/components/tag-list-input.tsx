import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TagListInputProps = {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  options?: string[]
}

// Free-text tags with click-to-add suggestions from the vocabulary endpoint.
// Stands in for a full multi-select combobox — good enough for scoping
// fields (sectors, countries, regions, certifications) until that's needed.
export function TagListInput({ label, value, onChange, options }: TagListInputProps) {
  const [draft, setDraft] = React.useState("")

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  const suggestions = options?.filter((option) => !value.includes(option))

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
              title="Click to remove"
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
        placeholder="Type a value and press Enter"
      />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((option) => (
            <Badge
              key={option}
              variant="outline"
              className="cursor-pointer"
              onClick={() => addTag(option)}
              title="Click to add"
            >
              + {option}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
