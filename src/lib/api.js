const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

const apiBaseUrl = isSupabaseConfigured
  ? `${supabaseUrl}/functions/v1/dompetku-api`
  : ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  if (!isSupabaseConfigured) {
    throw new ApiError('Koneksi database belum tersedia.', 503)
  }

  const headers = {
    apikey: supabasePublishableKey,
    'Content-Type': 'application/json',
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Respons tanpa JSON ditangani sebagai kesalahan umum di bawah.
  }

  if (!response.ok) {
    throw new ApiError(payload?.error || 'Layanan belum dapat memproses permintaan.', response.status)
  }

  return payload
}
