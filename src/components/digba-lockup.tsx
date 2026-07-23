import digbaLogo from "@/assets/digba-logo.png"

// Logo for the centered, no-shell auth/error cards (Login, Set Password, Not
// Authorized) — the app shell header has its own inline copy.
export function DigbaLockup() {
  return (
    <div className="mb-6 flex items-center justify-center">
      <img src={digbaLogo} alt="digba" className="h-11 w-auto" />
    </div>
  )
}
