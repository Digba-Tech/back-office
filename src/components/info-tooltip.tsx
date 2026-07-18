import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Plain-language explanations next to consequential controls, for
// non-technical founders using this app without a walkthrough.
export function InfoTooltip({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 rounded-full"
          aria-label={t("infoTooltip.moreInfo")}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty">{children}</TooltipContent>
    </Tooltip>
  )
}

// Pairs a <Label> with an InfoTooltip — the common case for form fields.
export function LabelWithInfo({
  htmlFor,
  children,
  info,
}: {
  htmlFor?: string
  children: React.ReactNode
  info: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>
      <InfoTooltip>{info}</InfoTooltip>
    </div>
  )
}
