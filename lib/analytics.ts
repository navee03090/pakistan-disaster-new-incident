import type { Incident } from '@/lib/supabase/queries'
import { formatIncidentType } from '@/lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function buildIncidentsTrend(incidents: Incident[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { month: MONTHS[d.getMonth()], year: d.getFullYear(), monthIndex: d.getMonth() }
  })

  return months.map(({ month, year, monthIndex }) => {
    const monthIncidents = incidents.filter(i => {
      const d = new Date(i.created_at)
      return d.getFullYear() === year && d.getMonth() === monthIndex
    })
    return {
      month,
      incidents: monthIncidents.length,
      resolved: monthIncidents.filter(i => i.status === 'resolved').length,
      pending: monthIncidents.filter(i => i.status !== 'resolved').length,
    }
  })
}

export function buildIncidentTypes(incidents: Incident[]) {
  const counts: Record<string, number> = {}
  for (const i of incidents) {
    const label = formatIncidentType(i.emergency_type)
    counts[label] = (counts[label] ?? 0) + 1
  }
  const total = incidents.length || 1
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / total) * 100),
  }))
}

export function buildResponseTimeTrend(incidents: Incident[]) {
  const recent = [...incidents]
    .filter(i => i.processing_time_seconds != null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .reverse()

  if (recent.length === 0) {
    return [{ hour: '—', time: 0 }]
  }

  return recent.map(i => ({
    hour: new Date(i.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: false }),
    time: Number(i.processing_time_seconds?.toFixed(1) ?? 0),
  }))
}

export function buildDistrictData(incidents: Incident[]) {
  const counts: Record<string, number> = {}
  for (const i of incidents) {
    const district = i.location_name ?? `${i.latitude.toFixed(1)}, ${i.longitude.toFixed(1)}`
    counts[district] = (counts[district] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([district, count]) => ({ district, incidents: count }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 6)
}

export function buildResourceUtilization(deployments: { resource_type: string; created_at: string }[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => {
    const dayIndex = days.indexOf(day)
    const dayDeployments = deployments.filter(d => new Date(d.created_at).getDay() === (dayIndex + 1) % 7)
    const count = (type: string) =>
      dayDeployments.filter(d => d.resource_type.toLowerCase().includes(type)).length * 15 + 40

    return {
      day,
      ambulance: Math.min(100, count('ambulance')),
      firetrucks: Math.min(100, count('fire')),
      rescue: Math.min(100, count('rescue')),
      police: Math.min(100, count('police')),
    }
  })
}
