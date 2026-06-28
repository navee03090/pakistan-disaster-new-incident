'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ArrowLeft, Mail, Lock, User } from 'lucide-react'
import { signUpAction } from '@/app/login/actions'

export default function SignUpForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await signUpAction(fullName, email, password, redirect)

    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    if (result?.success) {
      setSuccess(result.success)
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
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-sm text-muted-foreground">Register as an emergency official</p>
            </div>
          </div>

          {success ? (
            <div className="p-4 rounded-lg border border-cyan-500/50 bg-cyan-500/10 space-y-3">
              <p className="text-sm text-cyan-400">{success}</p>
              <p className="text-xs text-muted-foreground">
                After confirming your email, return here to sign in. If you don&apos;t see the email, check spam.
              </p>
              <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-background">Go to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Muhammad Hassan"
                  required
                  autoComplete="name"
                  className="bg-card border-border"
                />
              </div>
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
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="bg-card border-border"
                />
              </div>

              {error && (
                <div className="p-3 rounded border border-red-500/50 bg-red-500/10 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-background h-11"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-cyan-400 hover:text-cyan-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
