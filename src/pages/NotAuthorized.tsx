import { useTranslation } from "react-i18next"

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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("notAuthorized.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
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
          <Button onClick={onSignOut} variant="outline" className="w-fit">
            {t("notAuthorized.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
