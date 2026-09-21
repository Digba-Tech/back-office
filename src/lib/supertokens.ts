import SuperTokens from "supertokens-web-js"
import EmailPassword from "supertokens-web-js/recipe/emailpassword"
import EmailVerification from "supertokens-web-js/recipe/emailverification"
import Session from "supertokens-web-js/recipe/session"

const apiDomain = import.meta.env.VITE_API_DOMAIN

if (!apiDomain) {
  throw new Error("Missing VITE_API_DOMAIN — check your .env file.")
}

// Custom UI, not SuperTokens' prebuilt components — see
// BACKOFFICE_ADMIN_GUIDE_V2.md §3 and app/supertokens_config.py's
// website_base_path="/" on the backend, which is set up to expect this
// app's own routes rather than SuperTokens' own auth pages. supertokens-web-js
// (unlike supertokens-auth-react) never renders anything itself, so appInfo
// has no websiteDomain/websiteBasePath — those only exist for the prebuilt-UI
// package. apiDomain and this app's own origin are still separate hosts
// (confirmed by backend), so the session cookie/anti-CSRF/auto-refresh
// handling below is mandatory, not optional — this init() call transparently
// patches window.fetch to attach it; the rest of the app (see src/lib/api.ts)
// must keep using plain fetch and never hand-roll its own Authorization
// header again.
SuperTokens.init({
  appInfo: {
    appName: "Digba Back Office",
    apiDomain,
    apiBasePath: "/auth",
  },
  recipeList: [
    Session.init({
      onHandleEvent: (context) => {
        if (context.action === "SIGN_OUT" || context.action === "UNAUTHORISED") {
          sessionListeners.forEach((listen) => listen())
        }
      },
    }),
    EmailPassword.init(),
    EmailVerification.init(),
  ],
})

// There's no Supabase-style onAuthStateChange subscription in
// supertokens-web-js — this fills the same role so AuthProvider can react
// to a session ending from *outside* its own signOut() call (e.g. a 401
// that survives the SDK's own silent refresh).
type SessionEventListener = () => void
const sessionListeners = new Set<SessionEventListener>()

export function onSessionEnded(listener: SessionEventListener): () => void {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}
