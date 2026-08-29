import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FilePenLine, Plus, Search, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { canManageAdministration } from "@/auth/permissions"
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { apiRequest, getApiErrorMessage } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"


function CategoriesSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-live="polite" role="status">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-7 h-10 w-full" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({length:6}, (_, index) => <Skeleton className="h-32" key={index} />)}
      </div>
      <span className="sr-only">Loading categories</span>
    </PageContainer>
  )
}


export function CategoriesPage() {
  const {user} = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const isAdmin = canManageAdministration(user)
  const categoriesQuery = useQuery({
    queryFn:({signal}) => apiRequest("categories/", {signal}),
    queryKey:queryKeys.categories.all,
    staleTime:120_000,
  })
  const createMutation = useMutation({
    mutationFn:(values) => apiRequest("categories/", {body:values, method:"POST"}),
  })
  const updateMutation = useMutation({
    mutationFn:({categoryUid, values}) => apiRequest(`categories/${categoryUid}`, {body:values, method:"PATCH"}),
  })
  const deleteMutation = useMutation({
    mutationFn:(categoryUid) => apiRequest(`categories/${categoryUid}`, {method:"DELETE"}),
  })
  const categories = useMemo(
    () => Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [],
    [categoriesQuery.data],
  )
  const visibleCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return normalizedSearch
      ? categories.filter((category) => category.name.toLowerCase().includes(normalizedSearch))
      : categories
  }, [categories, search])

  async function refreshCategoryData({refreshIncidents=false}={}) {
    const invalidations = [queryClient.invalidateQueries({queryKey:queryKeys.categories.all})]
    if (refreshIncidents) {
      invalidations.push(queryClient.invalidateQueries({queryKey:queryKeys.incidents.all}))
    }
    await Promise.all(invalidations)
  }

  async function createCategory(values) {
    await createMutation.mutateAsync(values)
    await refreshCategoryData()
    toast.success("Category created")
  }

  async function renameCategory(category, values) {
    await updateMutation.mutateAsync({categoryUid:category.uid, values})
    await refreshCategoryData({refreshIncidents:true})
    toast.success("Category renamed")
  }

  async function deleteCategory(category) {
    try {
      await deleteMutation.mutateAsync(category.uid)
      await refreshCategoryData({refreshIncidents:true})
      toast.success("Category deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "IncidentHub could not delete this category."))
      throw error
    }
  }

  if (categoriesQuery.isPending) {
    return <CategoriesSkeleton />
  }

  if (categoriesQuery.isError) {
    return (
      <PageContainer>
        <PageHeader
          description="Browse the operational classifications available for incidents."
          eyebrow="Classification"
          title="Categories"
        />
        <ErrorState
          className="mt-8 max-w-none"
          description="IncidentHub could not retrieve the category catalog."
          onRetry={categoriesQuery.refetch}
          title="Could not load categories"
        />
      </PageContainer>
    )
  }

  const createAction = isAdmin ? (
    <CategoryFormDialog
      onSave={createCategory}
      trigger={(
        <Button>
          <Plus aria-hidden="true" className="size-4" />
          Create category
        </Button>
      )}
    />
  ) : null

  return (
    <PageContainer>
      <PageHeader
        actions={createAction}
        description="Browse reusable operational classifications. Administrators can maintain the catalog."
        eyebrow="Classification"
        title="Categories"
      />

      {categories.length === 0 ? (
        <EmptyState
          action={createAction}
          className="mt-8 max-w-none"
          description={isAdmin
            ? "Create the first category so incidents can be classified consistently."
            : "An administrator has not created any incident categories yet."}
          icon={Tags}
          title="No categories available"
        />
      ) : (
        <>
          <label className="relative mt-7 block max-w-xl">
            <span className="sr-only">Search categories</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" value={search} />
          </label>

          {visibleCategories.length === 0 ? (
            <EmptyState
              action={(
                <button className="text-sm font-medium text-blue-700 hover:text-blue-800" onClick={() => setSearch("")} type="button">
                  Clear search
                </button>
              )}
              className="mt-6 max-w-none"
              description="No category names match your search."
              icon={Search}
              title="No matching categories"
            />
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleCategories.map((category) => (
                <Card key={category.uid}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{category.name}</CardTitle>
                      <p className="mt-1 text-xs text-slate-500">Created <DateTimeDisplay value={category.created_at} /></p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                      <Tags aria-hidden="true" className="size-4" />
                    </span>
                  </CardHeader>
                  {isAdmin ? (
                    <CardContent className="flex flex-wrap gap-2">
                      <CategoryFormDialog
                        category={category}
                        onSave={(values) => renameCategory(category, values)}
                        trigger={(
                          <Button size="sm" variant="outline">
                            <FilePenLine aria-hidden="true" className="size-4" />
                            Rename
                          </Button>
                        )}
                      />
                      <ConfirmDialog
                        confirmLabel="Delete category"
                        description={`Delete “${category.name}”? It will be removed from associated incidents, but the incidents themselves will remain.`}
                        isPending={deleteMutation.isPending && deleteMutation.variables === category.uid}
                        onConfirm={() => deleteCategory(category)}
                        title="Delete category"
                        trigger={(
                          <Button disabled={deleteMutation.isPending && deleteMutation.variables === category.uid} size="sm" variant="destructive">
                            <Trash2 aria-hidden="true" className="size-4" />
                            Delete
                          </Button>
                        )}
                      />
                    </CardContent>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
