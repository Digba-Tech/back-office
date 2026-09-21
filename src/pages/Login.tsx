import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router-dom"
import { signIn, signUp } from "supertokens-web-js/recipe/emailpassword"
import { sendVerificationEmail } from "supertokens-web-js/recipe/emailverification"
import { z } from "zod"

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type Mode = "signin" | "signup"

// Self-service sign-up is the only account-creation path in V2 (guide §2) —
// there's no ops-provisioned temp password anymore, so this page handles
// both sign-in and sign-up. Admin access itself is still granted entirely
// out-of-band by ops (guide §2, provision_admin_supertokens.py); this page
// never claims or checks that, it only gets a person authenticated.
export function Login() {
  const { t } = useTranslation()
  const { sessionExists, refresh } = useAuth()
  const location = useLocation()
  const [mode, setMode] = React.useState<Mode>("signin")

  if (sessionExists) {
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
              {mode === "signin" ? t("login.title") : t("login.signUpTitle")}
            </CardTitle>
            <CardDescription>
              {mode === "signin" ? t("login.description") : t("login.signUpDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mode === "signin" ? (
              <SignInForm onSignedIn={refresh} />
            ) : (
              <SignUpForm onSignedUp={refresh} />
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-fit justify-self-center"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? t("login.toggleToSignUp") : t("login.toggleToSignIn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type SignInValues = { email: string; password: string }

function SignInForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const { t } = useTranslation()
  const [error, setError] = React.useState<string | null>(null)

  const signInSchema = z.object({
    email: z.string().email(t("login.emailInvalid")),
    password: z.string().min(1, t("login.passwordRequired")),
  })

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: SignInValues) {
    setError(null)
    try {
      const response = await signIn({
        formFields: [
          { id: "email", value: values.email },
          { id: "password", value: values.password },
        ],
      })

      if (response.status === "OK") {
        await onSignedIn()
        return
      }
      if (response.status === "FIELD_ERROR") {
        for (const field of response.formFields) {
          form.setError(field.id as "email" | "password", { message: field.error })
        }
        return
      }
      if (response.status === "WRONG_CREDENTIALS_ERROR") {
        setError(t("login.wrongCredentials"))
        return
      }
      setError(t("login.signInNotAllowed"))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failedFallback"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.emailLabel")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.passwordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <Alert variant="warning" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("login.signingIn") : t("login.signIn")}
        </Button>
      </form>
    </Form>
  )
}

type SignUpValues = { email: string; password: string; confirmPassword: string }

function SignUpForm({ onSignedUp }: { onSignedUp: () => Promise<void> }) {
  const { t } = useTranslation()
  const [error, setError] = React.useState<string | null>(null)

  const signUpSchema = z
    .object({
      email: z.string().email(t("login.emailInvalid")),
      password: z.string().min(8, t("login.passwordMinLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("login.passwordMismatch"),
      path: ["confirmPassword"],
    })

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: SignUpValues) {
    setError(null)
    try {
      const response = await signUp({
        formFields: [
          { id: "email", value: values.email },
          { id: "password", value: values.password },
        ],
      })

      if (response.status === "OK") {
        try {
          await sendVerificationEmail()
        } catch {
          // Non-fatal — the verify-email screen has its own resend button.
        }
        await onSignedUp()
        return
      }
      if (response.status === "FIELD_ERROR") {
        for (const field of response.formFields) {
          form.setError(field.id as "email" | "password", { message: field.error })
        }
        return
      }
      setError(t("login.signUpNotAllowed"))
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.signUpFailedFallback"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.emailLabel")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.passwordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.confirmPasswordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <Alert variant="warning" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("login.signingUp") : t("login.signUp")}
        </Button>
      </form>
    </Form>
  )
}
