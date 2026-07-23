import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DigbaLockup } from "@/components/digba-lockup"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotAuthorized({
  email,
  onSignOut,
}: {
  email?: string | null
  onSignOut: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <DigbaLockup />
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-attention-tint">
              <TriangleAlert className="size-6 text-attention" aria-hidden="true" />
            </div>
            <CardTitle className="font-heading text-2xl text-navy">
              {t("notAuthorized.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-center text-sm text-ink-500">
            <p>
              {email ? (
                <>
                  {t("notAuthorized.bodyWithEmailIntro")} <strong>{email}</strong>{" "}
                  {t("notAuthorized.bodyWithEmailRest")}
                </>
              ) : (
                t("notAuthorized.bodyWithoutEmail")
              )}
            </p>
            <p>{t("notAuthorized.explanation")}</p>
            <Button onClick={onSignOut} variant="outline" className="w-fit justify-self-center">
              {t("notAuthorized.logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
