import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Locale2 } from "@/lib/types"

// A side-by-side fr/en pair for the V2 requirements catalog's bilingual
// fields (action titles/descriptions, evidence names/guidance). French is
// the primary reference language (see BACKOFFICE_ADMIN_GUIDE_V2.md §5) so it
// renders first.
export function BilingualInput({
  idPrefix,
  label,
  value,
  onChange,
  multiline = false,
}: {
  idPrefix: string
  label: string
  value: Locale2
  onChange: (next: Locale2) => void
  multiline?: boolean
}) {
  const Field = multiline ? Textarea : Input
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-ink-500">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-fr`} className="text-[11px] text-ink-500">
            FR
          </Label>
          <Field
            id={`${idPrefix}-fr`}
            value={value.fr}
            onChange={(e) => onChange({ ...value, fr: e.target.value })}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-en`} className="text-[11px] text-ink-500">
            EN
          </Label>
          <Field
            id={`${idPrefix}-en`}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
