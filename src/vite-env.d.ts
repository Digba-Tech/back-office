/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend's public origin — shared by SuperTokens (apiBasePath "/auth")
  // and the admin API (VITE_API_BASE_URL below, "/api/v2/admin"). This
  // app's own origin isn't needed by supertokens-web-js — see
  // src/lib/supertokens.ts, it's the custom-UI SDK and never builds its own
  // redirect URLs (unlike supertokens-auth-react's prebuilt UI).
  readonly VITE_API_DOMAIN: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
