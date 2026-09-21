import * as React from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router-dom"
import {
  getEmailVerificationTokenFromURL,
  sendVerificationEmail,
  verifyEmail,
} from "supertokens-web-js/recipe/emailverification"

import { useAuth } from "@/auth/AuthProvider"
import { DigbaLockup } from "@/components/digba-lockup"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Reached two ways: (1) RequireSession redirects here whenever a logged-in
// session's email isn't verified yet — guide §2.4, required before ANY
// session-guarded route works; (2) the verification link SuperTokens emails
// the user lands here with a token in the URL, which this screen consumes.
export function VerifyEmail() {
  const { t } = useTranslation()
  const { sessionExists, loading, emailVerified, email, signOut, refresh } = useAuth()
  const location = useLocation()

  const [verifying, setVerifying] = React.useState(false)
  const [verifyError, setVerifyError] = React.useState<string | null>(null)
  const [resending, setResending] = React.useState(false)
  const [resendMessage, setResendMessage] = React.useState<string | null>(null)
  const [resendError, setResendError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const token = getEmailVerificationTokenFromURL()
    if (!token) return

    setVerifying(true)
    verifyEmail()
      .then((response) => {
        if (response.status === "OK") {
          return refresh()
        }
        setVerifyError(t("verifyEmail.verifyFailedInvalidToken"))
      })
      .catch((err) => {
        setVerifyError(
          err instanceof Error ? err.message : t("verifyEmail.verifyFailedFallback")
        )
      })
      .finally(() => setVerifying(false))
    // Only ever runs once, against the token present when this screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onResend() {
    setResendMessage(null)
    setResendError(null)
    setResending(true)
    try {
      const response = await sendVerificationEmail()
      if (response.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
        setResendMessage(t("verifyEmail.resendAlreadyVerified"))
        await refresh()
        return
      }
      setResendMessage(t("verifyEmail.resendSuccess"))
    } catch (err) {
      setResendError(
        err instanceof Error ? err.message : t("verifyEmail.resendFailedFallback")
      )
    } finally {
      setResending(false)
    }
  }

  if (loading) return null

  if (!sessionExists) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (emailVerified === true) {
    const from =
      (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname ?? "/sources"
    return <Navigate to={from} replace />
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <DigbaLockup />
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-navy">
              {t("verifyEmail.title")}
            </CardTitle>
            <CardDescription>
              {email
                ? t("verifyEmail.description", { email })
                : t("verifyEmail.descriptionNoEmail")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {verifying && <Skeleton className="h-8 w-full" />}
            {verifyError && (
              <Alert variant="warning" role="alert">
                <AlertDescription>{verifyError}</AlertDescription>
              </Alert>
            )}
            {resendMessage && (
              <Alert role="status">
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            )}
            {resendError && (
              <Alert variant="warning" role="alert">
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}
            <Button type="button" disabled={resending} onClick={() => void onResend()}>
              {resending ? t("verifyEmail.resending") : t("verifyEmail.resend")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refresh()}
            >
              {t("verifyEmail.continueButton")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-fit justify-self-center"
              onClick={() => void signOut()}
            >
              {t("verifyEmail.logoutInstead")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
