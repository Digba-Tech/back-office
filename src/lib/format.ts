// Centralizes locale-aware date formatting so every page renders timestamps
// in the viewer's current language (en-US vs fr-FR conventions differ:
// month/day order, "AM/PM" vs 24h, etc.) instead of hardcoding one.
export function formatDateTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language)
}
