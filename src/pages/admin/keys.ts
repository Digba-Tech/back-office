import * as React from "react"
import { useTranslation } from "react-i18next"

import { humanizeKey } from "@/lib/format"

/**
 * API values like `step`, `severity`, `lens`, `job_type` and `operation`
 * are stable English keys, not display text — they are translated here and
 * never rendered raw.
 *
 * Some of those sets are open: pipeline `step`, `operation`, `standard`,
 * `role` and `model` are free TEXT at the source so a new analyzer can ship
 * without a migration (metrics guide §8.2). An unknown value therefore
 * falls back to a humanised key rather than a blank cell — "Tabular
 * extraction" is a worse label than a translated one and a far better one
 * than nothing.
 */
export function useKeyLabel(): (group: KeyGroup, value: string) => string {
  const { t, i18n } = useTranslation()

  return React.useCallback(
    (group: KeyGroup, value: string) => {
      const path = `admin.keys.${group}.${value}`
      return i18n.exists(path) ? t(path) : humanizeKey(value)
    },
    [t, i18n]
  )
}

export type KeyGroup =
  | "funnelStep"
  | "severity"
  | "jobType"
  | "pipelineStep"
  | "operation"
  | "costRole"
  | "resolutionBucket"
  | "standard"
  | "lens"
  | "documentStatus"
  | "documentType"
  | "pipelineStatus"
  | "accessAction"
