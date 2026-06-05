import { useState } from 'react'

const ENVIRONMENTS = {
  production: {
    label: 'Production',
    banner: 'bg-red-600',
    bannerText: 'text-white',
    card: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    primaryBtn: 'bg-red-600 hover:bg-red-700',
    ring: 'focus:ring-red-500',
    warning: 'You are operating on the LIVE production environment.',
  },
  sandbox: {
    label: 'Sandbox',
    banner: 'bg-blue-600',
    bannerText: 'text-white',
    card: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'focus:ring-blue-500',
    warning: 'You are operating on the sandbox environment.',
  },
}

function App() {
  const [env, setEnv] = useState(null) // null | 'production' | 'sandbox'
  const [code, setCode] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [rotateStatus, setRotateStatus] = useState(null)
  const [message, setMessage] = useState('')

  function selectEnv(selected) {
    // Reset form state when switching environment
    setEnv(selected)
    setCode('')
    setEmailStatus(null)
    setRotateStatus(null)
    setMessage('')
  }

  async function handleRequestEmail() {
    setEmailStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/dvla/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEmailStatus('sent')
    } catch (err) {
      setEmailStatus('error')
      setMessage(`Failed to send email: ${err.message}`)
    }
  }

  async function handleRotate(e) {
    e.preventDefault()
    if (!code.trim()) return
    setRotateStatus('rotating')
    setMessage('')
    try {
      const res = await fetch('/api/dvla/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), env }),
      })
      if (!res.ok) throw new Error(await res.text())
      setRotateStatus('success')
      setMessage('Password rotated and Azure updated successfully.')
      setCode('')
    } catch (err) {
      setRotateStatus('error')
      setMessage(`Rotation failed: ${err.message}`)
    }
  }

  const theme = env ? ENVIRONMENTS[env] : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Environment banner */}
      {theme && (
        <div className={`${theme.banner} ${theme.bannerText} text-center text-sm font-medium py-2`}>
          {theme.warning}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-md w-full max-w-md p-8 border-2 ${theme ? theme.card : 'border-transparent'}`}>

          <h1 className="text-2xl font-semibold text-gray-800 mb-1">DVLA Password Rotation</h1>
          <p className="text-sm text-gray-500 mb-8">Rotate the DVLA API password and update Azure automatically.</p>

          {/* Environment selector */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">Select environment</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => selectEnv('sandbox')}
                className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  env === 'sandbox'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-blue-300'
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={() => selectEnv('production')}
                className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  env === 'production'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:border-red-300'
                }`}
              >
                Production
              </button>
            </div>
            {env && (
              <p className={`mt-2 text-xs font-medium px-2 py-1 rounded inline-block ${theme.badge}`}>
                {theme.label} selected
              </p>
            )}
          </div>

          {/* Steps — only shown once env is selected */}
          {env && (
            <>
              {/* Step 1 */}
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Step 1 — Request verification email</h2>
                <button
                  onClick={handleRequestEmail}
                  disabled={emailStatus === 'sending'}
                  className={`w-full ${theme.primaryBtn} disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors`}
                >
                  {emailStatus === 'sending' ? 'Sending…' : 'Send Verification Email'}
                </button>
                {emailStatus === 'sent' && (
                  <p className="mt-2 text-sm text-green-600">Email sent. Check your inbox.</p>
                )}
                {emailStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600">{message}</p>
                )}
              </div>

              {/* Step 2 */}
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Step 2 — Enter code and rotate password</h2>
                <form onSubmit={handleRotate} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Enter verification code"
                    className={`border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${theme.ring}`}
                  />
                  <button
                    type="submit"
                    disabled={rotateStatus === 'rotating' || !code.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                  >
                    {rotateStatus === 'rotating' ? 'Rotating…' : 'Rotate Password'}
                  </button>
                </form>
                {rotateStatus === 'success' && (
                  <p className="mt-3 text-sm text-green-600">{message}</p>
                )}
                {rotateStatus === 'error' && (
                  <p className="mt-3 text-sm text-red-600">{message}</p>
                )}
              </div>
            </>
          )}

          {/* Logout */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-right">
            <a href="/auth/logout" className="text-xs text-gray-400 hover:text-gray-600">Sign out</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
