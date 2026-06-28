import { incidentAgent } from './incident.agent'
import { classificationAgent } from './classification.agent'
import { priorityAgent } from './priority.agent'
import { resourceAgent } from './resource.agent'
import { communicationAgent } from './communication.agent'
import { analyticsAgent } from './analytics.agent'
import type {
  EmergencyCategory,
  OrchestratorContext,
  OrchestratorInput,
  OrchestratorOutput,
  PriorityLevel,
  SupabaseClientType,
} from './types'
import type { Json } from '@/lib/supabase/database.types'
import {
  addActivityFeed,
  addTimelineEvent,
  updateResourceCounts,
} from '@/lib/supabase/queries'

const CATEGORY_TO_EMERGENCY: Record<EmergencyCategory, string> = {
  Flood: 'flood',
  Fire: 'fire',
  Medical: 'other',
  Earthquake: 'earthquake',
  'Road Accident': 'accident',
  'Gas Leak': 'other',
  'Building Collapse': 'other',
}

const PRIORITY_TO_SEVERITY: Record<PriorityLevel, string> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
}

const RESOURCE_TYPE_MAP: Record<string, string> = {
  Ambulance: 'Ambulances',
  Police: 'Police Units',
  'Medical Team': 'Rescue Teams',
  Shelter: 'Shelter Tents',
  Boat: 'Rescue Teams',
  Food: 'Medical Supplies',
}

const AGENT_TIMELINE = [
  'Incident Understanding',
  'Classification Complete',
  'Priority Scored',
  'Resources Allocated',
  'Communications Generated',
  'Response Active',
]

function generateUnitCode(resource: string): string {
  const prefix: Record<string, string> = {
    Ambulance: 'AMB',
    Police: 'PU',
    'Medical Team': 'MT',
    Shelter: 'SH',
    Boat: 'BT',
    Food: 'FD',
  }
  const code = prefix[resource] ?? 'RS'
  return `${code}-${Math.floor(Math.random() * 900 + 100)}`
}

async function storeInSupabase(
  supabase: SupabaseClientType,
  incidentId: string,
  output: OrchestratorOutput,
  processingTimeSeconds: number
): Promise<void> {
  const { incident, classification, priority, resources, communication } = output

  await supabase
    .from('incidents')
    .update({
      status: 'response_active',
      location_name: incident.location,
      emergency_type: CATEGORY_TO_EMERGENCY[classification.category] ?? 'other',
      severity: PRIORITY_TO_SEVERITY[priority.priority] ?? 'medium',
      affected_people: incident.peopleAffected,
      ai_confidence: classification.confidence,
      processing_time_seconds: processingTimeSeconds,
      ai_risk_assessment: priority.reason,
      ai_geographic_impact: `${incident.location}, ${incident.district}. ${incident.summary}`,
      ai_resource_recommendation: `Dispatch: ${resources.resources.join(', ')}. ETA: ${resources.estimatedArrival}`,
      infrastructure_damage:
        priority.priority === 'Critical'
          ? 'Severe'
          : priority.priority === 'High'
            ? 'Moderate'
            : 'Minor',
      ai_agent_outputs: JSON.parse(JSON.stringify(output)) as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', incidentId)

  for (const resource of resources.resources) {
    await supabase.from('resource_deployments').insert({
      incident_id: incidentId,
      resource_type: resource,
      unit_code: generateUnitCode(resource),
      location: `${incident.location}, ${incident.district}`,
      deployment_status: priority.priority === 'Critical' ? 'Active' : 'En Route',
      crew: resource === 'Ambulance' ? '2 Paramedics' : 'Response Team',
      arrived_at:
        priority.priority === 'Critical' ? new Date().toISOString() : null,
    })

    const mappedType = RESOURCE_TYPE_MAP[resource]
    if (mappedType) {
      await updateResourceCounts(supabase, mappedType, 1)
    }
  }

  await addActivityFeed(
    supabase,
    `Multi-agent AI pipeline completed in ${processingTimeSeconds.toFixed(1)}s`,
    'success',
    incidentId
  )
  await addActivityFeed(
    supabase,
    communication.citizenMessage.slice(0, 120),
    'info',
    incidentId
  )
  await addActivityFeed(
    supabase,
    `${resources.resources.length} resources dispatched for ${classification.category} in ${incident.district}`,
    'alert',
    incidentId
  )
}

export async function orchestratorAgent(
  input: OrchestratorInput,
  context?: OrchestratorContext
): Promise<OrchestratorOutput> {
  const startTime = Date.now()
  const { supabase, incidentId } = context ?? {}

  if (supabase && incidentId) {
    await supabase
      .from('incidents')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', incidentId)

    await addTimelineEvent(supabase, incidentId, 'Incident Reported', 'completed')
    await addTimelineEvent(supabase, incidentId, 'AI Multi-Agent Pipeline Started', 'active')
  }

  const incident = await incidentAgent(input)

  if (supabase && incidentId) {
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[0], 'completed')
  }

  const classification = await classificationAgent({ incident })

  if (supabase && incidentId) {
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[1], 'completed')
  }

  const priority = await priorityAgent({ incident, classification })

  if (supabase && incidentId) {
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[2], 'completed')
  }

  const resources = await resourceAgent({ incident, classification, priority })

  if (supabase && incidentId) {
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[3], 'completed')
  }

  const communication = await communicationAgent({
    incident,
    classification,
    priority,
    resources,
  })

  if (supabase && incidentId) {
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[4], 'completed')
  }

  const analytics = await analyticsAgent(supabase)

  const processingTimeSeconds = (Date.now() - startTime) / 1000

  const output: OrchestratorOutput = {
    incident,
    classification,
    priority,
    resources,
    communication,
    analytics,
    reasoningBreakdown: {
      incident: incident.reasoning,
      classification: classification.reasoning,
      priority: priority.reasoning,
      resources: resources.reasoning,
    },
  }

  if (supabase && incidentId) {
    await storeInSupabase(supabase, incidentId, output, processingTimeSeconds)
    await addTimelineEvent(supabase, incidentId, AGENT_TIMELINE[5], 'completed')
  }

  return output
}
