import * as React from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { PanelError } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { NO_VALUE, formatDateTime } from "@/lib/format"

import { useCustomerLookup } from "./queries"

/**
 * Find a customer when you know the contact person but not what they
 * called their company.
 *
 * Submit-driven on purpose. Every lookup is audited — including a miss,
 * because "who asked whether this person is a customer" is exactly what
 * the trail records — so a type-ahead would write a row per keystroke and
 * bury the searches someone actually meant.
 *
 * Exact match only, by design: a substring search across a user directory
 * is a harvesting tool, and this workflow starts from an address you
 * already have.
 */
export function CustomerLookup() {
  const { t, i18n } = useTranslation()
  const [draft, setDraft] = React.useState("")
  const [submitted, setSubmitted] = React.useState("")

  const lookup = useCustomerLookup(submitted, submitted.length > 0)

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(draft.trim())
  }

  return (
    <section className="rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-resting)]">
      <h2 className="mb-1 font-heading text-[17px] leading-tight font-semibold text-navy">
        {t("admin.lookup.title")}
      </h2>
      <p className="mb-3 max-w-[70ch] text-[12px] leading-relaxed text-ink-400">
        {t("admin.lookup.auditedHint")}
      </p>

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("admin.lookup.placeholder")}
          aria-label={t("admin.lookup.title")}
          className="max-w-[320px]"
        />
        <Button type="submit" disabled={draft.trim().length === 0}>
          <Search aria-hidden="true" />
          {t("admin.lookup.search")}
        </Button>
      </form>

      {lookup.isError ? (
        <div className="mt-4">
          <PanelError error={lookup.error} />
        </div>
      ) : null}

      {submitted && lookup.isPending ? (
        <Skeleton className="mt-4 h-20 w-full" />
      ) : null}

      {lookup.data ? (
        lookup.data.matches.length === 0 ? (
          // Not an error state: "this address is not a customer" is an
          // answer, and the one the search was asking for.
          <p className="mt-4 text-sm text-ink-500">
            {t("admin.lookup.noMatch", { email: lookup.data.email })}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lookup.data.matches.map((match) => (
              <li
                key={match.company_id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-2"
              >
                <Link
                  to={`/admin/customers/${match.company_id}`}
                  className="font-medium text-navy underline-offset-4 hover:underline"
                >
                  {match.name}
                </Link>
                <span className="text-[12px] text-ink-400">
                  {t("admin.lookup.created", {
                    when: formatDateTime(match.created_at, i18n.language),
                  })}
                </span>
                <span className="text-[12px] text-ink-400">
                  {t("admin.lookup.lastAnalyzed", {
                    when: match.last_analyzed_at
                      ? formatDateTime(match.last_analyzed_at, i18n.language)
                      : NO_VALUE,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {/* One person can own several companies: companies.user_id has no
          unique index, so the answer is a list and a single hit is not
          guaranteed to be the only one. */}
      {lookup.data && lookup.data.matches.length > 1 ? (
        <p className="mt-3 text-[12px] text-ink-400">
          {t("admin.lookup.multiple", { count: lookup.data.matches.length })}
        </p>
      ) : null}
    </section>
  )
}
