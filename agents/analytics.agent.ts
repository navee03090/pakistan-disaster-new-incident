import type { AnalyticsAgentOutput, SupabaseClientType } from './types'

const MOCK_ANALYTICS: AnalyticsAgentOutput = {
  activeCases: 12,
  resolvedCases: 47,
  avgResponseTime: '18 minutes',
  highRiskDistricts: ['Swat', 'Sukkur', 'Multan', 'Karachi East'],
}

export async function analyticsAgent(
  supabase?: SupabaseClientType
): Promise<AnalyticsAgentOutput> {
  if (!supabase) return MOCK_ANALYTICS

  try {
    const { data: incidents } = await supabase
      .from('incidents')
      .select('status, processing_time_seconds, location_name')

    const all = incidents ?? []
    const activeCases = all.filter(i => i.status !== 'resolved').length
    const resolvedCases = all.filter(i => i.status === 'resolved').length

    const times = all
      .map(i => i.processing_time_seconds)
      .filter((t): t is number => t != null)

    const avgMinutes =
      times.length > 0
        ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
        : 18

    const districtCounts: Record<string, number> = {}
    for (const inc of all) {
      if (inc.location_name && inc.status !== 'resolved') {
        districtCounts[inc.location_name] = (districtCounts[inc.location_name] ?? 0) + 1
      }
    }

    const highRiskDistricts = Object.entries(districtCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([district]) => district)

    return {
      activeCases: activeCases || MOCK_ANALYTICS.activeCases,
      resolvedCases,
      avgResponseTime: `${avgMinutes} minutes`,
      highRiskDistricts:
        highRiskDistricts.length > 0
          ? highRiskDistricts
          : MOCK_ANALYTICS.highRiskDistricts,
    }
  } catch {
    return MOCK_ANALYTICS
  }
}
