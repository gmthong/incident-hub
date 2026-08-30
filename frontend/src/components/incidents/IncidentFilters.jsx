import { RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { INCIDENT_RELATIONSHIPS, INCIDENT_SORTS } from "@/utils/incidents"


export function IncidentFilters({categories, filters, hasActiveFilters, onChange, onClear}) {
  return (
    <section aria-label="Incident filters" className="mt-7 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-surface)]">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(13rem,1.4fr)_repeat(4,minmax(9rem,1fr))]">
        <label className="relative md:col-span-2 lg:col-span-1">
          <span className="sr-only">Search incidents</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search title, service, environment"
            value={filters.search}
          />
        </label>

        <label>
          <span className="sr-only">Filter by status</span>
          <Select onChange={(event) => onChange("status", event.target.value)} value={filters.status}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </label>

        <label>
          <span className="sr-only">Filter by environment</span>
          <Input
            maxLength={50}
            onChange={(event) => onChange("environment", event.target.value)}
            placeholder="Filter environment"
            value={filters.environment}
          />
        </label>

        <label>
          <span className="sr-only">Filter by category</span>
          <Select onChange={(event) => onChange("category", event.target.value)} value={filters.category}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.uid} value={category.uid}>{category.name}</option>
            ))}
          </Select>
        </label>

        <label>
          <span className="sr-only">Filter by relationship</span>
          <Select onChange={(event) => onChange("relationship", event.target.value)} value={filters.relationship}>
            <option value={INCIDENT_RELATIONSHIPS.ALL}>All relationships</option>
            <option value={INCIDENT_RELATIONSHIPS.REPORTED_BY_ME}>Reported by me</option>
            <option value={INCIDENT_RELATIONSHIPS.ASSIGNED_TO_ME}>Assigned to me</option>
            <option value={INCIDENT_RELATIONSHIPS.UNASSIGNED}>Unassigned</option>
          </Select>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <span className="shrink-0 font-medium">Sort by</span>
          <Select className="min-w-48" onChange={(event) => onChange("sort", event.target.value)} value={filters.sort}>
            <option value={INCIDENT_SORTS.CREATED_DESC}>Newest reported</option>
            <option value={INCIDENT_SORTS.OCCURRED_DESC}>Newest occurrence</option>
            <option value={INCIDENT_SORTS.OCCURRED_ASC}>Oldest occurrence</option>
            <option value={INCIDENT_SORTS.UPDATED_DESC}>Recently updated</option>
          </Select>
        </label>
        <Button disabled={!hasActiveFilters} onClick={onClear} size="sm" variant="ghost">
          <RotateCcw aria-hidden="true" className="size-4" />
          Clear filters
        </Button>
      </div>
    </section>
  )
}
