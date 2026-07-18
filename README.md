# DIGBA Back-Office

Admin client app for founders to manage the knowledge-source catalog and
review AI-extracted regulatory requirements. See `BACKOFFICE_ADMIN_GUIDE.md`
for the full spec this implements.

Stack: Vite + React + TypeScript, Tailwind + shadcn/ui, TanStack Query,
React Router, Supabase Auth.

## Setup

```bash
npm install
cp .env.example .env   # fill in real values, see below
npm run dev
```

## Environment variables

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Same Supabase project the backend uses. |
| `VITE_SUPABASE_ANON_KEY` | The project's public anon key — safe to embed in a browser app. Never the service-role key. |
| `VITE_API_BASE_URL` | Base URL of the backend, including its `/api/v1` prefix (admin routes live under `/admin` on this) — currently `https://api.digba-tech.com/api/v1`. |

Login only works for accounts the backend/ops team has already flagged as
admin (`app_metadata.role == "admin"`) — this app has no signup flow and
never touches the service-role key.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — oxlint
