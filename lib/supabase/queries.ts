import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type Incident = Database['public']['Tables']['incidents']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type ResourceDeployment = Database['public']['Tables']['resource_deployments']['Row']
export type IncidentTimeline = Database['public']['Tables']['incident_timeline']['Row']
export type ActivityFeedItem = Database['public']['Tables']['activity_feed']['Row']

type Client = SupabaseClient<Database>

export async function fetchIncidents(supabase: Client, status?: string) {
  let query = supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    const statusMap: Record<string, string> = {
      processing: 'processing',
      deployed: 'dispatch_sent',
      resolved: 'resolved',
    }
    const mapped = statusMap[status]
    if (mapped) query = query.eq('status', mapped)
  }

  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function fetchIncidentById(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function fetchResources(supabase: Client) {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('type')
  return { data: data ?? [], error }
}

export async function fetchDeployments(supabase: Client, incidentId?: string) {
  let query = supabase
    .from('resource_deployments')
    .select('*')
    .order('created_at', { ascending: false })

  if (incidentId) query = query.eq('incident_id', incidentId)

  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function fetchTimeline(supabase: Client, incidentId: string) {
  const { data, error } = await supabase
    .from('incident_timeline')
    .select('*')
    .eq('incident_id', incidentId)
    .order('event_time', { ascending: true })
  return { data: data ?? [], error }
}

export async function fetchActivityFeed(supabase: Client, limit = 10) {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error }
}

export async function fetchDashboardStats(supabase: Client) {
  const [incidents, resources, deployments] = await Promise.all([
    supabase.from('incidents').select('id, status, ai_confidence, processing_time_seconds, created_at'),
    supabase.from('resources').select('total, deployed'),
    supabase.from('resource_deployments').select('id, deployment_status'),
  ])

  const allIncidents = incidents.data ?? []
  const activeIncidents = allIncidents.filter(i => i.status !== 'resolved')
  const resolvedIncidents = allIncidents.filter(i => i.status === 'resolved')
  const processingTimes = allIncidents
    .map(i => i.processing_time_seconds)
    .filter((t): t is number => t != null)

  const avgProcessing =
    processingTimes.length > 0
      ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(1)
      : '—'

  const confidences = allIncidents
    .map(i => i.ai_confidence)
    .filter((c): c is number => c != null)
  const avgConfidence =
    confidences.length > 0
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : null

  const totalDeployed = (resources.data ?? []).reduce((sum, r) => sum + r.deployed, 0)
  const enRoute = (deployments.data ?? []).filter(d => d.deployment_status === 'En Route').length

  return {
    activeIncidents: activeIncidents.length,
    resolvedIncidents: resolvedIncidents.length,
    totalIncidents: allIncidents.length,
    avgProcessing,
    avgConfidence,
    totalDeployed,
    enRoute,
  }
}

export async function addActivityFeed(
  supabase: Client,
  message: string,
  eventType: ActivityFeedItem['event_type'] = 'info',
  incidentId?: string
) {
  return supabase.from('activity_feed').insert({
    message,
    event_type: eventType,
    incident_id: incidentId ?? null,
  })
}

export async function addTimelineEvent(
  supabase: Client,
  incidentId: string,
  eventLabel: string,
  eventStatus: IncidentTimeline['event_status'] = 'completed'
) {
  return supabase.from('incident_timeline').insert({
    incident_id: incidentId,
    event_label: eventLabel,
    event_status: eventStatus,
    event_time: new Date().toISOString(),
  })
}

export async function updateResourceCounts(
  supabase: Client,
  type: string,
  deltaDeployed: number
) {
  const { data: resource } = await supabase
    .from('resources')
    .select('*')
    .eq('type', type)
    .single()

  if (!resource) return { error: new Error('Resource not found') }

  const deployed = Math.min(resource.total, Math.max(0, resource.deployed + deltaDeployed))
  const available = resource.total - deployed

  return supabase
    .from('resources')
    .update({ deployed, available, updated_at: new Date().toISOString() })
    .eq('id', resource.id)
}
