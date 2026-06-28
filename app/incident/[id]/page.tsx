'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  fetchIncidentById,
  fetchTimeline,
  fetchDeployments,
  fetchResources,
  type Incident,
  type IncidentTimeline,
  type ResourceDeployment,
  type Resource,
} from '@/lib/supabase/queries'
import { useSupabaseRealtime } from '@/lib/hooks/use-supabase-realtime'
import { fetchIncidentPhotos } from '@/lib/supabase/storage'
import {
  formatTimeAgo,
  formatIncidentType,
  formatSeverity,
  formatStatusLabel,
  formatIncidentId,
  formatCoordinates,
  formatTime,
} from '@/lib/format'

export default function IncidentDetailPage() {
  const params = useParams()
  const incidentId = params.id as string

  const [incident, setIncident] = useState<Incident | null>(null)
  const [timeline, setTimeline] = useState<IncidentTimeline[]>([])
  const [deployments, setDeployments] = useState<ResourceDeployment[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [photos, setPhotos] = useState<{ id: string; public_url: string; file_name: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [incidentRes, timelineRes, deploymentsRes, resourcesRes, photosRes] = await Promise.all([
      fetchIncidentById(supabase, incidentId),
      fetchTimeline(supabase, incidentId),
      fetchDeployments(supabase, incidentId),
      fetchResources(supabase),
      fetchIncidentPhotos(supabase, incidentId),
    ])
    if (incidentRes.data) setIncident(incidentRes.data)
    setTimeline(timelineRes.data)
    setDeployments(deploymentsRes.data)
    setResources(resourcesRes.data)
    setPhotos(photosRes.data)
    setLoading(false)
  }, [incidentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useSupabaseRealtime(['incidents', 'incident_timeline', 'resource_deployments'], loadData)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading incident...</p>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Incident not found.</p>
        <Link href="/dashboard">
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-background">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const durationMinutes = Math.floor(
    (new Date(incident.updated_at).getTime() - new Date(incident.created_at).getTime()) / 60000
  )

  const resourceSummary = resources.slice(0, 4)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card/30">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h1 className="text-3xl font-bold">
                      {formatIncidentType(incident.emergency_type)} Incident
                    </h1>
                  </div>
                  <p className="text-muted-foreground">Incident ID: {formatIncidentId(incident.id)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm mb-2 ${
                    incident.severity === 'high' || incident.severity === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {formatSeverity(incident.severity)} SEVERITY
                  </span>
                  <p className="text-xs text-muted-foreground">Status: {formatStatusLabel(incident.status)}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reported</p>
                  <p className="font-semibold">{formatTimeAgo(incident.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold">{durationMinutes} minutes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Affected</p>
                  <p className="font-semibold text-cyan-400">~{(incident.affected_people ?? 0).toLocaleString()} people</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-green-400">{formatStatusLabel(incident.status)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Original Incident Report
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reporter</label>
                  <p className="font-semibold mt-1">{incident.first_name} {incident.last_name}</p>
                  <p className="text-sm text-muted-foreground">{incident.phone}</p>
                  {incident.email && <p className="text-sm text-muted-foreground">{incident.email}</p>}
                </div>
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-2 text-sm leading-relaxed">{incident.description}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="font-mono text-sm mt-1">{formatCoordinates(incident.latitude, incident.longitude)}</p>
                    {incident.location_name && <p className="text-xs text-muted-foreground mt-1">{incident.location_name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Affected</label>
                    <p className="font-semibold text-lg text-cyan-400 mt-1">~{(incident.affected_people ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Injuries</label>
                    <p className="font-semibold text-orange-400">{incident.injuries ?? 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Infrastructure Damage</label>
                    <p className="font-semibold">{incident.infrastructure_damage ?? 'Pending analysis'}</p>
                  </div>
                </div>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4">Photos & Evidence</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <a
                      key={photo.id}
                      href={photo.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border border-border hover:border-cyan-500/50 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.public_url} alt={photo.file_name ?? 'Incident photo'} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(incident.ai_risk_assessment || incident.ai_geographic_impact || incident.ai_resource_recommendation) && (
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  AI Analysis & Insights
                </h2>
                <div className="space-y-4">
                  {incident.ai_risk_assessment && (
                    <div className="p-4 rounded border border-cyan-500/30 bg-card/50">
                      <p className="text-sm font-medium mb-2">🔍 Risk Assessment</p>
                      <p className="text-sm text-muted-foreground">{incident.ai_risk_assessment}</p>
                    </div>
                  )}
                  {incident.ai_geographic_impact && (
                    <div className="p-4 rounded border border-cyan-500/30 bg-card/50">
                      <p className="text-sm font-medium mb-2">📍 Geographic Impact</p>
                      <p className="text-sm text-muted-foreground">{incident.ai_geographic_impact}</p>
                    </div>
                  )}
                  {incident.ai_resource_recommendation && (
                    <div className="p-4 rounded border border-cyan-500/30 bg-card/50">
                      <p className="text-sm font-medium mb-2">🏥 Resource Recommendation</p>
                      <p className="text-sm text-muted-foreground">{incident.ai_resource_recommendation}</p>
                    </div>
                  )}
                  {incident.ai_confidence != null && (
                    <div className="p-4 rounded border border-cyan-500/30 bg-card/50">
                      <p className="text-sm font-medium mb-2">⚡ Confidence Score</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${incident.ai_confidence}%` }} />
                        </div>
                        <span className="text-sm font-mono text-cyan-400">{incident.ai_confidence}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Response Timeline
              </h2>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Timeline will appear after AI processing.</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, idx) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          item.event_status === 'completed' ? 'bg-cyan-400'
                            : item.event_status === 'active' ? 'bg-orange-400' : 'bg-border'
                        }`} />
                        {idx < timeline.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                      </div>
                      <div className="py-1">
                        <p className="text-xs font-mono text-cyan-400">{formatTime(item.event_time)}</p>
                        <p className="text-sm">{item.event_label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card/30 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Quick Stats
              </h3>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <span className="font-semibold text-red-400">{formatSeverity(incident.severity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-semibold text-green-400">{formatStatusLabel(incident.status)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI Confidence</span>
                  <span className="font-semibold text-cyan-400">{incident.ai_confidence != null ? `${incident.ai_confidence}%` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Processing Time</span>
                  <span className="font-mono text-sm">{incident.processing_time_seconds != null ? `${incident.processing_time_seconds.toFixed(1)}s` : '—'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Affected Area
              </h3>
              <div className="h-40 bg-gradient-to-b from-cyan-500/10 to-transparent rounded border border-border flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">🗺️</div>
                  <p className="text-sm text-muted-foreground">{formatCoordinates(incident.latitude, incident.longitude)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Resources Deployed
              </h3>
              {deployments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deployments yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {deployments.map(d => (
                    <div key={d.id} className="flex justify-between">
                      <span>{d.resource_type} ({d.unit_code})</span>
                      <span className="font-mono text-cyan-400">{d.deployment_status}</span>
                    </div>
                  ))}
                </div>
              )}
              {resourceSummary.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                  {resourceSummary.map(r => (
                    <div key={r.id} className="flex justify-between">
                      <span>{r.type}</span>
                      <span>{r.deployed}/{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Link href="/resources">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-background">Manage Response</Button>
              </Link>
              <Link href={`/processing/${incident.id}`}>
                <Button variant="outline" className="w-full border-border">View Processing</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
