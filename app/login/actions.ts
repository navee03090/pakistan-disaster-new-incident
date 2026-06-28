'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthResult = {
  error?: string
  success?: string
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  )
}

export async function signInAction(
  email: string,
  password: string,
  redirectTo: string
): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return {
        error: 'Please confirm your email first. Check your inbox for the confirmation link, then try signing in again.',
      }
    }
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Invalid email or password. Please try again.' }
    }
    return { error: error.message }
  }

  redirect(redirectTo || '/dashboard')
}

export async function signUpAction(
  fullName: string,
  email: string,
  password: string,
  redirectTo: string
): Promise<AuthResult> {
  const supabase = await createClient()
  const siteUrl = getSiteUrl()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'official' },
      emailRedirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo || '/dashboard')}`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  if (data.session) {
    redirect(redirectTo || '/dashboard')
  }

  return {
    success: 'Account created! Check your email and click the confirmation link, then sign in.',
  }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resendConfirmationAction(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const siteUrl = getSiteUrl()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent('/dashboard')}`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Confirmation email sent. Please check your inbox.' }
}
