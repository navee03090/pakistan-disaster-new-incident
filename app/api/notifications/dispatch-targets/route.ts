import { NextResponse } from 'next/server'
import { getDepartmentsForEmergencyType } from '@/lib/notifications/dispatch-departments'
import { verifyApiSecret } from '@/lib/api-auth'

export async function GET(request: Request) {
  const authError = verifyApiSecret(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const emergencyType = searchParams.get('emergencyType') ?? 'other'
  const departments = getDepartmentsForEmergencyType(emergencyType)

  return NextResponse.json({ emergencyType, departments })
}
