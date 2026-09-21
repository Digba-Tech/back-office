import * as React from "react"
import { isEmailVerified } from "supertokens-web-js/recipe/emailverification"
import Session, { getAccessTokenPayloadSecurely } from "supertokens-web-js/recipe/session"

import { onVerificationRequired } from "@/lib/api"
import { onSessionEnded } from "@/lib/supertokens"

type Identity = {
  email: string | null
  name: string | null
  picture: string | null
  role: string | null
}

const EMPTY_IDENTITY: Identity = { email: null, name: null, picture: null, role: null }

type AuthContextValue = Identity & {
  sessionExists: boolean
  loading: boolean
  // From EmailVerification.isEmailVerified() — null while unknown/loading,
  // distinct from false so RequireSession doesn't flash the verify-email
  // screen before the first check resolves.
  emailVerified: boolean | null
  signOut: () => Promise<void>
  // Re-reads session + identity + verification status from SuperTokens.
  // Call after sign-in/sign-up, after verifying an email, or in response to
  // onSessionEnded/a 403 claim-validation error from the API layer.
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionExists, setSessionExists] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [emailVerified, setEmailVerified] = React.useState<boolean | null>(null)
  const [identity, setIdentity] = React.useState<Identity>(EMPTY_IDENTITY)

  const refresh = React.useCallback(async () => {
    const exists = await Session.doesSessionExist()
    setSessionExists(exists)

    if (!exists) {
      setIdentity(EMPTY_IDENTITY)
      setEmailVerified(null)
      return
    }

    const [payload, verification] = await Promise.all([
      getAccessTokenPayloadSecurely(),
      isEmailVerified(),
    ])

    setIdentity({
      email: payload?.email ?? null,
      name: payload?.name ?? null,
      picture: payload?.picture ?? null,
      role: payload?.role ?? null,
    })
    setEmailVerified(verification.isVerified)
  }, [])

  React.useEffect(() => {
    void refresh().finally(() => setLoading(false))
    const stopSessionEnded = onSessionEnded(() => void refresh())
    // A 403 with the email-verification claim (src/lib/api.ts) means the
    // access-token payload's stale — re-check so RequireSession picks up
    // emailVerified: false and routes to /verify-email.
    const stopVerificationRequired = onVerificationRequired(() => void refresh())
    return () => {
      stopSessionEnded()
      stopVerificationRequired()
    }
  }, [refresh])

  const signOut = React.useCallback(async () => {
    await Session.signOut()
    await refresh()
  }, [refresh])

  const value = React.useMemo(
    () => ({
      sessionExists,
      loading,
      emailVerified,
      ...identity,
      signOut,
      refresh,
    }),
    [sessionExists, loading, emailVerified, identity, signOut, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
