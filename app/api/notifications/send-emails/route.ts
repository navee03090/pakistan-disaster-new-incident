import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendIncidentEmails } from '@/lib/notifications/send-emails'
import { verifyApiSecret } from '@/lib/api-auth'

export async function POST(request: Request) {
  const authError = verifyApiSecret(request)
  if (authError) return authError

  try {
    const { incidentId } = await request.json()

    if (!incidentId || typeof incidentId !== 'string') {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const result = await sendIncidentEmails(supabase, incidentId)

    if (result.alreadySent) {
      return NextResponse.json({ success: true, alreadySent: true, ...result })
    }

    if (result.errors.length > 0 && result.sent === 0) {
      return NextResponse.json({ success: false, ...result }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send emails'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
