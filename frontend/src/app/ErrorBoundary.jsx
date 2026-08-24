import { Component } from "react"

import { ErrorState } from "@/components/feedback/ErrorState"


export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {hasError:false}
  }

  static getDerivedStateFromError() {
    return {hasError:true}
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("Unexpected render error", error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center p-6">
          <ErrorState
            title="IncidentHub could not render this page"
            description="Reload the application. If the problem continues, check the browser console and API status."
            actionLabel="Reload application"
            onRetry={() => window.location.reload()}
          />
        </main>
      )
    }

    return this.props.children
  }
}
