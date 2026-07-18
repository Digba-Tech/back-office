import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useAuth } from "@/auth/AuthProvider"
import { LanguageSwitcher } from "@/components/language-switcher"
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

type SetPasswordValues = { password: string; confirmPassword: string }

// Blocks the rest of the app until a founder replaces the ops-set temp
// password (guide §2 "Forcing a password change on first login").
export function SetPassword() {
  const { t } = useTranslation()
  const { completePasswordChange, signOut } = useAuth()
  const [error, setError] = React.useState<string | null>(null)

  const setPasswordSchema = z
    .object({
      password: z.string().min(8, t("setPassword.minLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("setPassword.mismatch"),
      path: ["confirmPassword"],
    })

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: SetPasswordValues) {
    setError(null)
    try {
      await completePasswordChange(values.password)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("setPassword.failedFallback")
      )
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("setPassword.title")}</CardTitle>
          <CardDescription>{t("setPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("setPassword.newPasswordLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
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
                    <FormLabel>{t("setPassword.confirmPasswordLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t("setPassword.submitting")
                  : t("setPassword.submit")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-fit justify-self-center"
                onClick={() => void signOut()}
              >
                {t("setPassword.logoutInstead")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
