import { z } from "zod"


export function normalizeCategoryName(value) {
  return value.trim().replace(/\s+/g, " ")
}


export const categorySchema = z.object({
  name:z
    .string()
    .transform(normalizeCategoryName)
    .pipe(
      z
        .string()
        .min(1, "Category name is required")
        .max(50, "Category name must be 50 characters or fewer"),
    ),
})
