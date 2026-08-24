import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"


// Merge conditional Tailwind class names without duplicated utilities.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
