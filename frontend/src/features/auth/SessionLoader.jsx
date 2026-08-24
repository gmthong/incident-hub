import { ShieldCheck } from "lucide-react"

import { Spinner } from "@/components/feedback/Spinner"


export function FullPageSessionLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Restoring your IncidentHub session</p>
          <p className="mt-1 text-sm text-slate-400">Checking your secure sign-in cookie.</p>
        </div>
        <Spinner className="size-5 text-blue-300" label="Checking session" />
      </div>
    </main>
  )
}
