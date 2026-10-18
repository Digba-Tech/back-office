import { ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"

/**
 * The entire PostHog integration on this side: a link out, nothing more.
 *
 * The back-office is not instrumented — no `posthog-js`, no events, no
 * consent banner, no recording. An admin's screen shows several tenants at
 * once, so capturing it would mix one customer's data into a session about
 * another. This points an admin AT PostHog rather than reporting on them.
 *
 * It is deliberately NOT labelled "Analytics", and it sits below the
 * panels rather than beside them. Every number on these pages comes from
 * our own database and is exact; PostHog's are lossy by nature — ad
 * blockers, declined consent, connections dropping mid-request. A link
 * reading "Analytics" next to exact figures invites precisely the
 * conflation that keeping the two apart exists to prevent.
 *
 * Renders nothing when the project URL is unset, so a deployment without
 * it shows no dead link.
 */
export function PostHogLink() {
  const { t } = useTranslation()
  const url = import.meta.env.VITE_POSTHOG_PROJECT_URL

  if (!url) return null

  return (
    <section className="border-t border-line pt-4">
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy underline-offset-4 hover:underline"
      >
        {t("admin.posthog.link")}
        <ExternalLink aria-hidden="true" className="size-3.5" />
      </a>
      <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed text-ink-400">
        {t("admin.posthog.caveat")}
      </p>
    </section>
  )
}
