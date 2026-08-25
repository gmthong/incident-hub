import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useForm } from "react-hook-form"

import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { API_ERROR_CODES } from "@/config/constants"
import { getApiErrorMessage } from "@/services/apiClient"
import { categorySchema } from "@/utils/categories"


export function CategoryFormDialog({category, onSave, trigger}) {
  const isEditing = Boolean(category)
  const [open, setOpen] = useState(false)
  const {
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    defaultValues:{name:category?.name || ""},
    mode:"onBlur",
    resolver:zodResolver(categorySchema),
  })

  function changeOpen(nextOpen) {
    if (nextOpen) {
      reset({name:category?.name || ""})
    }
    setOpen(nextOpen)
  }

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values)
      setOpen(false)
    } catch (error) {
      if (error?.code === API_ERROR_CODES.CATEGORY_EXISTS) {
        setError("name", {message:"A category with this name already exists."}, {shouldFocus:true})
        return
      }
      setError("root.serverError", {
        message:getApiErrorMessage(error, "IncidentHub could not save this category."),
      })
    }
  })

  return (
    <Dialog
      description={isEditing
        ? "Rename this category wherever it appears in IncidentHub."
        : "Add a reusable classification to the category catalog."}
      onOpenChange={changeOpen}
      open={open}
      title={isEditing ? "Rename category" : "Create category"}
      trigger={trigger}
    >
      <form className="space-y-5" noValidate onSubmit={submit}>
        {errors.root?.serverError?.message ? (
          <InlineAlert variant="error">{errors.root.serverError.message}</InlineAlert>
        ) : null}
        <FormField error={errors.name?.message} id={`category-name-${category?.uid || "new"}`} label="Category name" required>
          <Input maxLength={50} placeholder="e.g. Database" {...register("name")} />
        </FormField>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button isLoading={isSubmitting} loadingLabel="Saving category" type="submit">
            <Save aria-hidden="true" className="size-4" />
            {isEditing ? "Save name" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
