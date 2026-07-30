import axios from 'axios'

const TOKEN_KEY = 'ansible_dashboard_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Every /api call carries the bearer token the backend requires.
axios.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token && cfg.url?.startsWith('/api')) {
    cfg.headers = cfg.headers ?? {}
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// A 401 means the stored token is wrong or the backend restarted with a new
// generated one. Drop it so the app falls back to the token prompt.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn
}

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken()
      onUnauthorized?.()
    }
    return Promise.reject(err)
  }
)

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await axios.get('/api/folders', { headers: { Authorization: `Bearer ${token}` } })
    return true
  } catch {
    return false
  }
}

/**
 * Write edited scalar values back into the original YAML text.
 *
 * The backend only accepts raw text, because round-tripping through a YAML
 * parser and dumper deletes every comment in the file — and these vars.yml files
 * carry the reasoning behind each setting. This patches the individual lines that
 * changed instead, so structured editing stays available without losing comments.
 *
 * Only top-level scalars are patched. Anything nested must be edited in raw mode;
 * `unpatchable` reports those keys so the UI can say so.
 */
export function applyScalarEdits(
  raw: string,
  original: Record<string, unknown>,
  edited: Record<string, unknown>
): { text: string; unpatchable: string[] } {
  const lines = raw.split('\n')
  const unpatchable: string[] = []

  for (const key of Object.keys(edited)) {
    const before = original[key]
    const after = edited[key]
    if (before === after) continue

    const isScalar = (v: unknown) =>
      v === null || ['string', 'number', 'boolean'].includes(typeof v)

    if (!isScalar(after) || !isScalar(before)) {
      unpatchable.push(key)
      continue
    }

    // Match `key:` at the start of a line, ignoring commented-out occurrences.
    const idx = lines.findIndex((l) => new RegExp(`^${escapeKey(key)}\\s*:`).test(l))
    if (idx === -1) {
      unpatchable.push(key)
      continue
    }

    lines[idx] = `${key}: ${formatScalar(after)}`
  }

  return { text: lines.join('\n'), unpatchable }
}

function escapeKey(key: string): string {
  return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatScalar(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)

  const s = String(value)
  // Quote anything YAML would otherwise reinterpret: Jinja braces, colons,
  // leading indicators, or values that look like another type.
  if (
    s === '' ||
    /^[\s>|&*!%@`#-]/.test(s) ||
    /[:{}[\],]/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s)
  ) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return s
}
