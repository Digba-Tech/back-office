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
      className="flex items-center gap-1 text-sm"
      role="group"
      aria-label={t("language.label")}
    >
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">/</span>}
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(lang.code)}
            aria-pressed={current === lang.code}
            className={cn(
              "rounded-sm px-1 text-muted-foreground hover:text-foreground",
              current === lang.code && "font-semibold text-foreground"
            )}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  )
}
