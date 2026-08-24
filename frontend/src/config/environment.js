const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1"


function validateApiBaseUrl(value) {
  const normalizedValue = value.trim().replace(/\/+$/, "")

  try {
    const url = new URL(normalizedValue)
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("unsupported protocol")
    }
  } catch {
    throw new Error(
      "VITE_API_BASE_URL must be a valid HTTP or HTTPS URL, for example http://localhost:8000/api/v1",
    )
  }

  return normalizedValue
}


export const API_BASE_URL = validateApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
)
