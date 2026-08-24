import { z } from "zod"


// Validation shared by the public authentication forms.
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(100, "Email must be 100 characters or fewer")
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase())

export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password must be 100 characters or fewer")

export const newPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .refine(
    (value) => value.length >= 8
      && value.length <= 100
      && /[a-z]/.test(value)
      && /[A-Z]/.test(value)
      && /[0-9]/.test(value),
    "Password must be 8–100 characters and contain at least 1 lowercase letter, 1 uppercase letter, and 1 number",
  )

export const loginSchema = z.object({
  email:emailSchema,
  password:loginPasswordSchema,
})

export const registrationSchema = z.object({
  confirmPassword:z.string().min(1, "Confirm your password"),
  email:emailSchema,
  first_name:z.string().trim().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  last_name:z.string().trim().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  password:newPasswordSchema,
  username:z.string().trim().min(1, "Username is required").max(50, "Username must be 50 characters or fewer"),
}).refine((values) => values.password === values.confirmPassword, {
  message:"Passwords do not match",
  path:["confirmPassword"],
})

export const passwordResetRequestSchema = z.object({email:emailSchema})

export const passwordResetConfirmSchema = z.object({
  confirm_password:z.string().min(1, "Confirm your password"),
  new_password:newPasswordSchema,
}).refine((values) => values.new_password === values.confirm_password, {
  message:"Passwords do not match",
  path:["confirm_password"],
})
