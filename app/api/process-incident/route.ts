import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processIncident } from '@/lib/ai/process-incident'
import { verifyApiSecret } from '@/lib/api-auth'

const PROCESSED_STATUSES = new Set(['response_active', 'dispatch_sent', 'monitoring', 'resolved'])

export async function POST(request: Request) {
  const authError = verifyApiSecret(request)
  if (authError) return authError

  try {
    const { incidentId } = await request.json()

    if (!incidentId || typeof incidentId !== 'string') {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('incidents')
      .select('status')
      .eq('id', incidentId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    if (PROCESSED_STATUSES.has(existing.status)) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status: existing.status,
      })
    }

    if (existing.status === 'processing') {
      return NextResponse.json(
        { success: true, inProgress: true, status: 'processing' },
        { status: 202 }
      )
    }

    const result = await processIncident(supabase, incidentId)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pipeline: result.pipeline, ai: result.ai })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
