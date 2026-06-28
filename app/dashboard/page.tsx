'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  MapPin,
  Users,
  TrendingUp,
  Activity,
  RefreshCw,
  Menu,
  LogOut,
  Bell,
  Settings,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  fetchIncidents,
  fetchResources,
  fetchActivityFeed,
  fetchDashboardStats,
  type Incident,
  type Resource,
  type ActivityFeedItem,
} from '@/lib/supabase/queries'
import { useSupabaseRealtime } from '@/lib/hooks/use-supabase-realtime'
import { useAuth } from '@/components/auth-provider'
import { signOutAction } from '@/app/login/actions'
import {
  formatTimeAgo,
  formatIncidentType,
  formatSeverity,
  formatStatusLabel,
  RESOURCE_COLORS,
} from '@/lib/format'

const IncidentsMap = dynamic(() => import('@/components/dashboard/incidents-map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map...</span>
    </div>
  ),
})

function statusIcon(status: string) {
  if (status === 'processing') return Activity
  if (status === 'resolved') return CheckCircle2
  if (status === 'monitoring') return Clock3
  return AlertCircle
}

export default function CommandCenterDashboard() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filter, setFilter] = useState('all')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [feed, setFeed] = useState<ActivityFeedItem[]>([])
  const [stats, setStats] = useState({
    activeIncidents: 0,
    avgProcessing: '—',
    avgConfidence: null as number | null,
    totalDeployed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [incidentsRes, resourcesRes, feedRes, statsRes] = await Promise.all([
      fetchIncidents(supabase, filter),
      fetchResources(supabase),
      fetchActivityFeed(supabase, 5),
      fetchDashboardStats(supabase),
    ])
    setIncidents(incidentsRes.data)
    setResources(resourcesRes.data)
    setFeed(feedRes.data)
    setSelectedIncidentId(prev =>
      prev && !incidentsRes.data.some(incident => incident.id === prev) ? null : prev
    )
    setStats({
      activeIncidents: statsRes.activeIncidents,
      avgProcessing: statsRes.avgProcessing,
      avgConfidence: statsRes.avgConfidence,
      totalDeployed: statsRes.totalDeployed,
    })
    setLoading(false)
  }, [filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useSupabaseRealtime(['incidents', 'resources', 'activity_feed'], loadData)

  const kpiCards = [
    {
      label: 'Active Incidents',
      value: String(stats.activeIncidents),
      change: `${incidents.length} total`,
      trend: stats.activeIncidents > 0 ? 'up' : undefined,
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      label: 'AI Processing Speed',
      value: stats.avgProcessing === '—' ? '—' : `${stats.avgProcessing}s`,
      change: 'avg analysis',
      icon: Activity,
      color: 'text-cyan-400',
    },
    {
      label: 'Resources Deployed',
      value: String(stats.totalDeployed),
      change: 'across all units',
      trend: stats.totalDeployed > 0 ? 'up' : undefined,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Prediction Accuracy',
      value: stats.avgConfidence != null ? `${stats.avgConfidence}%` : '—',
      change: 'AI confidence',
      trend: stats.avgConfidence != null ? 'up' : undefined,
      icon: TrendingUp,
      color: 'text-green-400',
    },
  ]

  const feedIcons: Record<string, typeof AlertTriangle> = {
    alert: AlertTriangle,
    success: CheckCircle2,
    info: Activity,
    warning: AlertCircle,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-foreground">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-background" />
                </div>
                <h1 className="text-xl font-bold text-cyan-400 hidden sm:block">Command Center</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="text-muted-foreground hidden sm:flex">
                  Analytics
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="ghost" size="sm" className="text-muted-foreground hidden sm:flex">
                  Resources
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={loadData} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="w-5 h-5" />
                {feed.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title={user?.email ?? 'Sign out'}
                onClick={() => signOutAction()}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition">
                <div className="flex justify-between items-start mb-4">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                  {card.trend && (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <ArrowUpRight className="w-3 h-3" />
                      {card.trend}
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-2">{card.label}</p>
                <p className="text-3xl font-bold mb-2">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.change}</p>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 rounded-lg border border-border bg-card/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Active Incidents</h2>
              <div className="flex gap-2">
                {['all', 'processing', 'deployed', 'resolved'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1 rounded transition ${
                      filter === f
                        ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No incidents yet.</p>
                <Link href="/report">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-background">Report Emergency</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Severity</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Affected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(incident => {
                      const StatusIcon = statusIcon(incident.status)
                      return (
                        <tr
                          key={incident.id}
                          onClick={() => setSelectedIncidentId(incident.id)}
                          className={`border-b border-border transition cursor-pointer ${
                            selectedIncidentId === incident.id
                              ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/30'
                              : 'hover:bg-card/50'
                          }`}
                        >
                          <td className="py-4 px-4">
                            <Link href={`/incident/${incident.id}`} className="block">
                              <span className="font-medium hover:text-cyan-400">{formatIncidentType(incident.emergency_type)}</span>
                              <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(incident.created_at)}</p>
                            </Link>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              {incident.location_name ?? `${incident.latitude.toFixed(2)}, ${incident.longitude.toFixed(2)}`}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                incident.severity === 'high' || incident.severity === 'critical'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}
                            >
                              {formatSeverity(incident.severity)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <StatusIcon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs">{formatStatusLabel(incident.status)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-cyan-400">
                            {(incident.affected_people ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <Link href="/report">
                <Button variant="outline" className="border-border text-cyan-400">
                  Report New Incident
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h2 className="text-lg font-semibold mb-4">Resource Status</h2>
              <div className="space-y-4">
                {resources.slice(0, 4).map(resource => (
                  <div key={resource.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{resource.type}</span>
                      <span className={`text-sm font-mono ${RESOURCE_COLORS[resource.type] ?? 'text-cyan-400'}`}>
                        {resource.deployed}/{resource.total}
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${RESOURCE_COLORS[resource.type] ?? 'text-cyan-400'}`}
                        style={{ width: `${resource.total > 0 ? (resource.deployed / resource.total) * 100 : 0}%`, backgroundColor: 'currentColor' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/resources" className="block mt-4 text-center text-xs text-cyan-400 hover:text-cyan-300">
                Manage all resources →
              </Link>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h2 className="text-lg font-semibold mb-4">Real-Time Feed</h2>
              <div className="space-y-3">
                {feed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  feed.map(item => {
                    const Icon = feedIcons[item.event_type] ?? Activity
                    return (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                        <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-cyan-400 font-mono">{formatTimeAgo(item.created_at)}</p>
                          <p className="text-sm">{item.message}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-border bg-card/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Live Incident Map
            </h2>
            <p className="text-xs text-muted-foreground">
              {incidents.length > 0
                ? `${incidents.length} incident${incidents.length === 1 ? '' : 's'} — click a row or pin for details`
                : 'Incident locations will appear here as reports come in'}
            </p>
          </div>
          <div className="h-96">
            <IncidentsMap
              incidents={incidents}
              selectedId={selectedIncidentId}
              onSelect={setSelectedIncidentId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
