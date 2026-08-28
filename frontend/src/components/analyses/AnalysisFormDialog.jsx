import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { InlineAlert } from "@/components/feedback/InlineAlert"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { ANALYSIS_SEVERITIES, API_ERROR_CODES } from "@/config/constants"
import { getApiErrorMessage } from "@/services/apiClient"
import { ANALYSIS_TEXT_MAX_LENGTH, analysisSchema } from "@/utils/analyses"


export function AnalysisFormDialog({analysis, onSave, trigger}) {
  const isEditing = Boolean(analysis)
  const [open, setOpen] = useState(false)
  const {
    control,
    formState:{errors, isSubmitting},
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm({
    defaultValues:{
      analysis_text:analysis?.analysis_text || "",
      severity:analysis?.severity || ANALYSIS_SEVERITIES.MEDIUM,
    },
    mode:"onBlur",
    resolver:zodResolver(analysisSchema),
  })
  const analysisText = useWatch({control, name:"analysis_text"}) || ""

  function changeOpen(nextOpen) {
    if (nextOpen) {
      reset({
        analysis_text:analysis?.analysis_text || "",
        severity:analysis?.severity || ANALYSIS_SEVERITIES.MEDIUM,
      })
    }
    setOpen(nextOpen)
  }

  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values)
      setOpen(false)
    } catch (error) {
      const message = error?.code === API_ERROR_CODES.ANALYSIS_NOT_FOUND
        ? "This analysis no longer exists."
        : error?.code === API_ERROR_CODES.INSUFFICIENT_PERMISSIONS
          ? "You no longer have permission to modify this analysis."
          : getApiErrorMessage(error, "IncidentHub could not save this analysis.")
      setError("root.serverError", {message})
    }
  })

  return (
    <Dialog
      className="max-w-2xl"
      description={isEditing
        ? "Update the severity and analysis text."
        : "Record operational findings, impact, or follow-up information."}
      onOpenChange={changeOpen}
      open={open}
      title={isEditing ? "Edit analysis" : "Add analysis"}
      trigger={trigger}
    >
      <form className="space-y-5" noValidate onSubmit={submit}>
        {errors.root?.serverError?.message ? (
          <InlineAlert variant="error">{errors.root.serverError.message}</InlineAlert>
        ) : null}

        <FormField error={errors.severity?.message} id={`analysis-severity-${analysis?.uid || "new"}`} label="Severity" required>
          <Select {...register("severity")}>
            <option value={ANALYSIS_SEVERITIES.LOW}>Low</option>
            <option value={ANALYSIS_SEVERITIES.MEDIUM}>Medium</option>
            <option value={ANALYSIS_SEVERITIES.HIGH}>High</option>
            <option value={ANALYSIS_SEVERITIES.CRITICAL}>Critical</option>
          </Select>
        </FormField>

        <FormField
          currentLength={analysisText.length}
          error={errors.analysis_text?.message}
          id={`analysis-text-${analysis?.uid || "new"}`}
          label="Analysis text"
          maxLength={ANALYSIS_TEXT_MAX_LENGTH}
          required
        >
          <Textarea
            maxLength={ANALYSIS_TEXT_MAX_LENGTH}
            placeholder="Describe findings, impact, contributing factors, or follow-up work."
            rows={9}
            {...register("analysis_text")}
          />
        </FormField>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button disabled={isSubmitting} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button isLoading={isSubmitting} loadingLabel="Saving analysis" type="submit">
            <Save aria-hidden="true" className="size-4" />
            {isEditing ? "Save analysis" : "Add analysis"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
