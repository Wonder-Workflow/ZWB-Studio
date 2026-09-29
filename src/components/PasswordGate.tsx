import { useState, type FormEvent } from 'react'
import { verifyPassword } from '../lib/auth'

const LOGO =
  'https://obsessionmarketing.com/wp-content/uploads/2024/04/cropped-Obsession-Marketing-Logo-9.png'

type Props = {
  onSuccess: () => void
}

export function PasswordGate({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const ok = await verifyPassword(password)
      if (ok) onSuccess()
      else setError('Wrong password.')
    } catch {
      setError('Could not verify.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="gate">
      <section className="gate-card">
        <div className="gate-accent" />
        <form className="gate-body" onSubmit={onSubmit}>
          {logoFailed ? null : (
            <img
              className="gate-logo"
              src={LOGO}
              alt="Obsession Marketing"
              onError={() => setLogoFailed(true)}
            />
          )}
          <h1 className="gate-title">Obsession Marketing · Zion White Bison</h1>
          <p className="gate-kicker">Content Calendar</p>
          <div className="field">
            <label className="sr-only" htmlFor="studio-password">
              Password
            </label>
            <input
              id="studio-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="gate-error">{error}</p> : null}
          <button className="btn btn-gold" type="submit" disabled={pending}>
            {pending ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </section>
    </main>
  )
}
