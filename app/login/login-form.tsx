'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ArrowLeft, Mail, Lock } from 'lucide-react'
import { signInAction, resendConfirmationAction } from '@/app/login/actions'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    urlError === 'auth_callback_failed'
      ? 'Email confirmation failed. Please try signing in or request a new confirmation email.'
      : null
  )
  const [success, setSuccess] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await signInAction(email, password, redirect)

    setLoading(false)

    if (result?.error) {
      setError(result.error)
      if (result.error.toLowerCase().includes('confirm')) {
        setShowResend(true)
      }
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email address first, then click resend.')
      return
    }
    setLoading(true)
    const result = await resendConfirmationAction(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="p-8 rounded-lg border border-border bg-card/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sign In</h1>
              <p className="text-sm text-muted-foreground">Official command center access</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="official@agency.gov.pk"
                required
                autoComplete="email"
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
                className="bg-card border-border"
              />
            </div>

            {error && (
              <div className="p-3 rounded border border-red-500/50 bg-red-500/10 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded border border-cyan-500/50 bg-cyan-500/10 text-sm text-cyan-400">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-background h-11"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {showResend && (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleResend}
                className="w-full border-border"
              >
                Resend confirmation email
              </Button>
            )}
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            No account?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="text-cyan-400 hover:text-cyan-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
