const SESSION_KEY = 'zwb-auth'
const DEFAULT_PASSWORD = 'zwb-studio'

export function hasSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setSession(on: boolean): void {
  if (on) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}

function localPassword(): string {
  return import.meta.env.VITE_APP_PASSWORD || DEFAULT_PASSWORD
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (response.ok) {
      const data = (await response.json()) as { ok?: boolean }
      return Boolean(data.ok)
    }

    if (response.status === 401) return false
  } catch {
    // Function is unavailable locally without `netlify dev`.
  }

  return password === localPassword()
}
