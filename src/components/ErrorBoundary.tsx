import { OctagonAlert } from "lucide-react"
import * as React from "react"
import { withTranslation, type WithTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

type Props = WithTranslation & { children: React.ReactNode }
type State = { error: Error | null }

// Without this, an unhandled render error (e.g. a frontend type not matching
// what the backend actually returns) unmounts the whole tree — a blank white
// page with no indication why. Caught this the hard way on SourceDetail.
// withTranslation (not the hook) because class components can't use hooks —
// it also re-renders this on language change, which useTranslation gives you
// for free in function components.
class ErrorBoundaryInner extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack)
  }

  render() {
    const { t } = this.props
    if (this.state.error) {
      return (
        <div className="flex min-h-svh items-center justify-center p-4">
          <div className="grid max-w-md justify-items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-danger-tint">
              <OctagonAlert className="size-6 text-destructive" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-2xl text-navy">
              {t("errorBoundary.title")}
            </h1>
            <p className="text-sm text-ink-500">{t("errorBoundary.description")}</p>
            <p className="font-mono text-xs text-ink-400">{this.state.error.message}</p>
            <Button
              className="w-fit"
              onClick={() => {
                window.location.href = "/sources"
              }}
            >
              {t("errorBoundary.backToSources")}
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInner)
