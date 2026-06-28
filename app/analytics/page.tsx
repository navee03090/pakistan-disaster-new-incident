'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Download, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchIncidents, fetchDeployments, fetchDashboardStats, type Incident } from '@/lib/supabase/queries'
import {
  buildIncidentsTrend,
  buildIncidentTypes,
  buildResponseTimeTrend,
  buildDistrictData,
  buildResourceUtilization,
} from '@/lib/analytics'
import { useSupabaseRealtime } from '@/lib/hooks/use-supabase-realtime'

const colors = ['#00d9ff', '#ff6b35', '#1e3a8a', '#10b981']

export default function AnalyticsDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [deployments, setDeployments] = useState<{ resource_type: string; created_at: string }[]>([])
  const [stats, setStats] = useState({ totalIncidents: 0, avgProcessing: '—', avgConfidence: null as number | null, totalDeployed: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [incidentsRes, deploymentsRes, statsRes] = await Promise.all([
      fetchIncidents(supabase),
      fetchDeployments(supabase),
      fetchDashboardStats(supabase),
    ])
    setIncidents(incidentsRes.data)
    setDeployments(deploymentsRes.data)
    setStats({
      totalIncidents: statsRes.totalIncidents,
      avgProcessing: statsRes.avgProcessing,
      avgConfidence: statsRes.avgConfidence,
      totalDeployed: statsRes.totalDeployed,
    })
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useSupabaseRealtime(['incidents', 'resource_deployments'], loadData)

  const incidentsTrend = buildIncidentsTrend(incidents)
  const incidentTypes = buildIncidentTypes(incidents)
  const responseTime = buildResponseTimeTrend(incidents)
  const districtData = buildDistrictData(incidents)
  const resourceUtilization = buildResourceUtilization(deployments)

  const metrics = [
    { label: 'Total Incidents', value: String(stats.totalIncidents), change: 'from Supabase' },
    { label: 'Avg Response Time', value: stats.avgProcessing === '—' ? '—' : `${stats.avgProcessing}s`, change: 'AI processing' },
    { label: 'Prediction Accuracy', value: stats.avgConfidence != null ? `${stats.avgConfidence}%` : '—', change: 'AI confidence' },
    { label: 'Resources Deployed', value: String(stats.totalDeployed), change: 'active units' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          <Button variant="outline" className="border-border flex items-center gap-2" onClick={loadData}>
            <Download className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading analytics from Supabase...</p>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border bg-card/30">
                  <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-green-400">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Incidents Over Time
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incidentsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="var(--chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved" stroke="var(--chart-4)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4">Incident Types</h2>
                {incidentTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No incident data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={incidentTypes} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name}: ${percentage}%`} outerRadius={80} dataKey="value">
                        {incidentTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4">AI Analysis Speed</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={responseTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    <Area type="monotone" dataKey="time" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4">Resource Utilization (Weekly)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Bar dataKey="ambulance" fill="var(--chart-1)" />
                    <Bar dataKey="firetrucks" fill="var(--chart-2)" />
                    <Bar dataKey="rescue" fill="var(--chart-3)" />
                    <Bar dataKey="police" fill="var(--chart-4)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="p-6 rounded-lg border border-border bg-card/30">
                <h2 className="text-lg font-semibold mb-4">Incidents by Location</h2>
                {districtData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No location data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={districtData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--muted-foreground)" />
                      <YAxis dataKey="district" type="category" stroke="var(--muted-foreground)" width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
                      <Bar dataKey="incidents" fill="var(--chart-1)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-cyan-400">💡</span>
                  Key Insights
                </h2>
                <div className="space-y-4">
                  <div className="p-3 rounded border border-border bg-card/50">
                    <p className="text-sm font-medium mb-1">📈 Trend Analysis</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalIncidents} total incidents tracked. {incidents.filter(i => i.status !== 'resolved').length} currently active.
                    </p>
                  </div>
                  <div className="p-3 rounded border border-border bg-card/50">
                    <p className="text-sm font-medium mb-1">⚡ Performance Metrics</p>
                    <p className="text-xs text-muted-foreground">
                      AI analysis average: {stats.avgProcessing === '—' ? 'pending data' : `${stats.avgProcessing}s`}.
                      {stats.avgConfidence != null && ` Response accuracy: ${stats.avgConfidence}%.`}
                    </p>
                  </div>
                  <div className="p-3 rounded border border-border bg-card/50">
                    <p className="text-sm font-medium mb-1">🎯 Top Incident Types</p>
                    <p className="text-xs text-muted-foreground">
                      {incidentTypes.slice(0, 3).map(t => `${t.name} (${t.value})`).join(', ') || 'Submit reports to see trends.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
