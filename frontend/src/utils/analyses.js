import { z } from "zod"

import { ANALYSIS_SEVERITY_VALUES } from "@/config/constants"


export const ANALYSIS_TEXT_MAX_LENGTH = 5000

export const analysisSchema = z.object({
  analysis_text:z
    .string()
    .trim()
    .min(1, "Analysis text is required")
    .max(ANALYSIS_TEXT_MAX_LENGTH, `Analysis text must be ${ANALYSIS_TEXT_MAX_LENGTH.toLocaleString()} characters or fewer`),
  severity:z.enum(ANALYSIS_SEVERITY_VALUES, {error:"Choose a valid severity"}),
})


export function filterAnalyses(analyses, {search="", severity=""}={}) {
  const normalizedSearch = search.trim().toLowerCase()
  return analyses.filter((analysis) => {
    const matchesSeverity = !severity || analysis.severity === severity
    const matchesSearch = !normalizedSearch || [
      analysis.analysis_text,
      analysis.uid,
      analysis.user_uid,
      analysis.incident_uid,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch))
    return matchesSeverity && matchesSearch
  })
}
