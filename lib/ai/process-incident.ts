import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { orchestratorAgent } from '@/agents/orchestrator.agent'
import { addActivityFeed } from '@/lib/supabase/queries'
import { formatIncidentType } from '@/lib/format'

type Client = SupabaseClient<Database>

export async function processIncident(supabase: Client, incidentId: string) {
  const { data: incident, error: fetchError } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single()

  if (fetchError || !incident) {
    return { error: fetchError ?? new Error('Incident not found') }
  }

  const { data: photos } = await supabase
    .from('incident_photos')
    .select('public_url')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true })
    .limit(1)

  const imageUrl = photos?.[0]?.public_url ?? null

  const voiceTranscript =
    typeof incident.description === 'string' && incident.description.includes('[Voice:')
      ? incident.description.split('[Voice:')[1]?.replace(']', '').trim() ?? null
      : null

  await addActivityFeed(
    supabase,
    `New ${formatIncidentType(incident.emergency_type)} reported — AI pipeline initiating`,
    'alert',
    incidentId
  )

  try {
    const pipeline = await orchestratorAgent(
      {
        text: incident.description,
        imageUrl,
        voiceTranscript,
      },
      { supabase, incidentId }
    )

    return {
      success: true,
      pipeline,
      ai: {
        ai_confidence: pipeline.classification.confidence,
        processing_time_seconds: null,
        ai_risk_assessment: pipeline.priority.reason,
        ai_geographic_impact: pipeline.incident.summary,
        ai_resource_recommendation: `Dispatch: ${pipeline.resources.resources.join(', ')}. ETA: ${pipeline.resources.estimatedArrival}`,
        infrastructure_damage:
          pipeline.priority.priority === 'Critical' ? 'Severe' : 'Moderate',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI pipeline failed'
    return { error: new Error(message) }
  }
}
