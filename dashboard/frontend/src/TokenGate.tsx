import { useState } from 'react'
import { Lock } from 'lucide-react'
import { setToken, verifyToken } from './api'

/**
 * The API requires a bearer token. This gate collects it once and stores it in
 * localStorage; the axios interceptor attaches it to every /api call.
 */
export default function TokenGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setChecking(true)
    setError('')

    const ok = await verifyToken(value.trim())
    setChecking(false)

    if (!ok) {
      setError('That token was rejected by the API.')
      return
    }
    setToken(value.trim())
    onAuthenticated()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold">Ansible Dashboard</h1>
        </div>

        <p className="text-sm text-gray-400">
          This dashboard runs playbooks against real infrastructure, so it requires an
          API token. It is the <code className="text-emerald-400">DASHBOARD_TOKEN</code>{' '}
          the backend was started with. If none was set, the backend logged a generated
          one at startup.
        </p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="API token"
          className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-700
                     focus:border-emerald-500 focus:outline-none font-mono text-sm"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500
                     disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
        >
          {checking ? 'Checking…' : 'Connect'}
        </button>
      </form>
    </div>
  )
}
