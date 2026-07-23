import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import type { Criticality, RequirementStatus, SourceType } from "@/lib/types"

// Centralizes the brief's semantic badge color table so no page hand-rolls
// its own status colors. Badge visuals only — Badge itself stays generic.
function BadgePill({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full px-2 text-[11px] font-semibold whitespace-nowrap uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}

const NEUTRAL = "bg-[#edf0f3] text-ink-500"
const GREEN_TINT = "bg-green-tint text-primary"
const AMBER_TINT = "bg-attention-tint text-attention"
const NAVY_FILLED = "bg-navy text-white"

export function ActiveStatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()
  return (
    <BadgePill className={active ? GREEN_TINT : NEUTRAL}>
      {active ? t("sources.list.statActive") : t("sources.list.statInactive")}
    </BadgePill>
  )
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  const { t } = useTranslation()
  const className =
    status === "draft" ? AMBER_TINT : status === "active" ? GREEN_TINT : NEUTRAL
  return (
    <BadgePill className={className}>{t(`enums.requirementStatus.${status}`)}</BadgePill>
  )
}

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  const { t } = useTranslation()
  const className =
    criticality === "core"
      ? NAVY_FILLED
      : criticality === "mandatory"
        ? AMBER_TINT
        : NEUTRAL
  return <BadgePill className={className}>{t(`enums.criticality.${criticality}`)}</BadgePill>
}

export function SourceTypeBadge({ type }: { type: SourceType }) {
  const { t } = useTranslation()
  return (
    <BadgePill className="bg-[#edf0f3] text-[#25384f]">
      {t(`enums.sourceType.${type}`)}
    </BadgePill>
  )
}
