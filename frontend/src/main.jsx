import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "@/app/App"
import { AppErrorBoundary } from "@/app/ErrorBoundary"
import { AppProviders } from "@/app/providers"
import "@/index.css"


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
)
