import { Check } from "lucide-react"


const requirements = [
  "8 to 100 characters",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
]


export function PasswordRequirements() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-700">Password requirements</p>
      <ul className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
        {requirements.map((requirement) => (
          <li className="flex items-center gap-1.5" key={requirement}>
            <Check aria-hidden="true" className="size-3.5 text-emerald-600" />
            {requirement}
          </li>
        ))}
      </ul>
    </div>
  )
}
