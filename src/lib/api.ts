const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'aldef.token'

export class ApiError extends Error {
  // Ditulis sebagai field eksplisit, bukan parameter property, karena proyek
  // ini memakai `erasableSyntaxOnly` — TypeScript hanya boleh dihapus, tidak
  // boleh menghasilkan kode runtime.
  status: number
  errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (response.status === 401) {
    // Token kedaluwarsa atau dicabut — buang supaya tidak dipakai ulang.
    tokenStore.clear()
    throw new ApiError('Sesi Anda berakhir. Silakan masuk kembali.', 401)
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? 'Terjadi kesalahan pada server.',
      response.status,
      payload?.errors ?? {},
    )
  }

  return payload as T
}
