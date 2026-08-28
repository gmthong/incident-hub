import { z } from "zod"

import { USER_ROLE_VALUES } from "@/config/constants"


const optionalName = z
  .string()
  .trim()
  .max(50, "Name must be 50 characters or fewer")
  .transform((value) => value || null)

export const userUpdateSchema = z.object({
  first_name:optionalName,
  last_name:optionalName,
  role:z.enum(USER_ROLE_VALUES, {error:"Choose a valid role"}),
  username:z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or fewer"),
})


export function filterUsers(users, {role="", search="", verification=""}={}) {
  const normalizedSearch = search.trim().toLowerCase()
  return users.filter((user) => {
    const matchesSearch = !normalizedSearch || [
      user.username,
      user.first_name,
      user.last_name,
      user.email,
      user.uid,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch))
    const matchesRole = !role || user.role === role
    const matchesVerification = !verification
      || (verification === "verified" ? user.is_verified : !user.is_verified)
    return matchesSearch && matchesRole && matchesVerification
  })
}
