/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend's public origin — shared by SuperTokens (apiBasePath "/auth")
  // and the admin API (VITE_API_BASE_URL below, "/api/v2/admin"). This
  // app's own origin isn't needed by supertokens-web-js — see
  // src/lib/supertokens.ts, it's the custom-UI SDK and never builds its own
  // redirect URLs (unlike supertokens-auth-react's prebuilt UI).
  readonly VITE_API_DOMAIN: string
  readonly VITE_API_BASE_URL: string

  // PostHog project URL, e.g. https://eu.posthog.com/project/<id>. The
  // back-office is not instrumented — this is only a link out
  // (POSTHOG_INTEGRATION_GUIDE.md §0). Optional: unset simply hides the
  // link rather than breaking the page.
  readonly VITE_POSTHOG_PROJECT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
