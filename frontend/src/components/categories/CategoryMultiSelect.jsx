import { useMemo, useState } from "react"
import { Search, Tags } from "lucide-react"

import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { API_ERROR_CODES } from "@/config/constants"
import { getApiErrorMessage } from "@/services/apiClient"


export function CategoryMultiSelect({categories, initialCategoryUids, onSave, trigger}) {
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedUids, setSelectedUids] = useState(new Set())
  const visibleCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return normalizedSearch
      ? categories.filter((category) => category.name.toLowerCase().includes(normalizedSearch))
      : categories
  }, [categories, search])

  function changeOpen(nextOpen) {
    if (!nextOpen && isSaving) {
      return
    }
    if (nextOpen) {
      setSelectedUids(new Set(initialCategoryUids))
      setSearch("")
      setError("")
    }
    setOpen(nextOpen)
  }

  function toggleCategory(categoryUid) {
    setSelectedUids((current) => {
      const next = new Set(current)
      if (next.has(categoryUid)) {
        next.delete(categoryUid)
      } else {
        next.add(categoryUid)
      }
      return next
    })
  }

  async function saveCategories() {
    setError("")
    setIsSaving(true)
    try {
      await onSave([...new Set(selectedUids)])
      setOpen(false)
    } catch (saveError) {
      if (saveError?.code === API_ERROR_CODES.CATEGORY_NOT_FOUND) {
        setError("One selected category no longer exists. Close the dialog, refresh, and try again.")
      } else if (saveError?.code === API_ERROR_CODES.INSUFFICIENT_PERMISSIONS) {
        setError("You no longer have permission to classify this incident.")
      } else {
        setError(getApiErrorMessage(saveError, "IncidentHub could not update the incident categories."))
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      description="Choose the complete set of categories that should classify this incident."
      onOpenChange={changeOpen}
      open={open}
      title="Manage incident categories"
      trigger={trigger}
    >
      <div className="space-y-4">
        {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}

        {categories.length > 0 ? (
          <label className="relative block">
            <span className="sr-only">Search categories</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" value={search} />
          </label>
        ) : null}

        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          {visibleCategories.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {visibleCategories.map((category) => (
                <li key={category.uid}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-slate-50">
                    <Checkbox
                      checked={selectedUids.has(category.uid)}
                      onChange={() => toggleCategory(category.uid)}
                    />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-sm text-slate-600">
              <Tags aria-hidden="true" className="mx-auto mb-2 size-5 text-slate-400" />
              {categories.length === 0 ? "No categories are available." : "No categories match this search."}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
          <span>{selectedUids.size} selected</span>
          <Button disabled={selectedUids.size === 0 || isSaving} onClick={() => setSelectedUids(new Set())} size="sm" variant="ghost">
            Clear selection
          </Button>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button disabled={isSaving} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button isLoading={isSaving} loadingLabel="Saving categories" onClick={saveCategories}>
            Save categories
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
