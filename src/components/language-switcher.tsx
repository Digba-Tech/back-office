import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const

// Founders using this app aren't all comfortable in the same language —
// available pre-login too, not just once inside the app.
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith("fr") ? "fr" : "en"

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-[#edf0f3] p-0.5 text-sm"
      role="group"
      aria-label={t("language.label")}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => void i18n.changeLanguage(lang.code)}
          aria-pressed={current === lang.code}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
            current === lang.code
              ? "bg-background text-navy shadow-[var(--shadow-resting)]"
              : "text-ink-500 hover:text-ink-700"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
