import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('incidents').select('*').eq('id', id).single()

    if (error || !data) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch incident'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
