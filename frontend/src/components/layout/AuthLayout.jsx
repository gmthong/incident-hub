import { ShieldCheck } from "lucide-react"
import { Outlet } from "react-router"


export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgb(37_99_235_/_0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgb(14_165_233_/_0.15),_transparent_36%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 text-white">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">IncidentHub</p>
            <p className="text-sm text-slate-400">Production operations workspace</p>
          </div>
        </div>
        <Outlet />
      </div>
    </main>
  )
}
