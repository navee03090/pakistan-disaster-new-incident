export function formatTimeAgo(date: string | Date): string {
  const then = new Date(date).getTime()
  const now = Date.now()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatIncidentType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function formatSeverity(severity: string): string {
  return severity.toUpperCase()
}

export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    reported: 'Reported',
    processing: 'Processing',
    dispatch_sent: 'Dispatch Sent',
    response_active: 'Response Active',
    monitoring: 'Monitoring',
    resolved: 'Resolved',
  }
  return labels[status] ?? status
}

export function formatIncidentId(id: string): string {
  return `INC-${id.slice(0, 8).toUpperCase()}`
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const EMERGENCY_TYPE_COLORS: Record<string, string> = {
  earthquake: 'text-red-400',
  flood: 'text-cyan-400',
  landslide: 'text-orange-400',
  cyclone: 'text-blue-400',
  fire: 'text-orange-400',
  accident: 'text-yellow-400',
  other: 'text-muted-foreground',
}

export const RESOURCE_COLORS: Record<string, string> = {
  Ambulances: 'text-red-400',
  'Fire Trucks': 'text-orange-400',
  'Rescue Teams': 'text-yellow-400',
  'Police Units': 'text-blue-400',
  'Medical Supplies': 'text-green-400',
  'Shelter Tents': 'text-cyan-400',
}
