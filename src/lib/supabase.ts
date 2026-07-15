import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file."
  )
}

// Public anon key only. The service-role key never belongs in this app —
// see BACKOFFICE_ADMIN_GUIDE.md §2 "Hard rules for your app".
export const supabase = createClient(url, anonKey)
