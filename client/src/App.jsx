import { useState } from 'react'

function App() {
  const [code, setCode] = useState('')
  const [emailStatus, setEmailStatus] = useState(null) // null | 'sending' | 'sent' | 'error'
  const [rotateStatus, setRotateStatus] = useState(null) // null | 'rotating' | 'success' | 'error'
  const [message, setMessage] = useState('')

  async function handleRequestEmail() {
    setEmailStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/dvla/request-code', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setEmailStatus('sent')
      setMessage('Verification email sent. Check your inbox.')
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
        body: JSON.stringify({ code: code.trim() }),
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">DVLA Password Rotation</h1>
        <p className="text-sm text-gray-500 mb-8">Rotate the DVLA API password and update Azure automatically.</p>

        {/* Step 1 */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Step 1 — Request verification email</h2>
          <button
            onClick={handleRequestEmail}
            disabled={emailStatus === 'sending'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
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
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Logout */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-right">
          <a href="/auth/logout" className="text-xs text-gray-400 hover:text-gray-600">Sign out</a>
        </div>
      </div>
    </div>
  )
}

export default App
