import { Suspense } from 'react'
import SignUpForm from './signup-form'

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
