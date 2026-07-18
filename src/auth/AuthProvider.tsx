import * as React from "react"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

type AuthContextValue = {
  session: Session | null
  loading: boolean
  // Ops sets a temp password on account creation (guide §1); this gates the
  // client's own UI until the founder replaces it. Unrelated to the
  // app_metadata.role admin check and never checked by the backend.
  mustChangePassword: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  completePasswordChange: (newPassword: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      }
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const completePasswordChange = React.useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    })
    if (error) throw error

    // updateUser's own auth-state event usually carries the refreshed user,
    // but the guide is explicit: re-fetch so the cleared flag takes effect
    // immediately rather than relying on that timing.
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError) setSession(data.session)
  }, [])

  const mustChangePassword =
    session?.user.user_metadata?.must_change_password === true

  const value = React.useMemo(
    () => ({
      session,
      loading,
      mustChangePassword,
      signIn,
      signOut,
      completePasswordChange,
    }),
    [session, loading, mustChangePassword, signIn, signOut, completePasswordChange]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
