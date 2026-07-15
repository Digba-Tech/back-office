import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotAuthorized({
  email,
  onSignOut,
}: {
  email?: string | null
  onSignOut: () => void
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Not authorized as admin</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>
            {email ? <>The account <strong>{email}</strong> is</> : "This account is"}{" "}
            a valid logged-in user, but isn't flagged as an admin.
          </p>
          <p>
            This is either expected (you're not a founder/admin), or the
            backend/ops team hasn't run the admin provisioning step for this
            account yet. Either way, it isn't something this app can fix —
            contact the backend/ops team.
          </p>
          <Button onClick={onSignOut} variant="outline" className="w-fit">
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
