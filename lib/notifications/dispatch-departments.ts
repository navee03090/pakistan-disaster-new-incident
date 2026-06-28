export type DispatchDepartment = {
  id: string
  name: string
  email: string
  description: string
}

/** Placeholder department inboxes — replace with real addresses in production. */
export const DISPATCH_DEPARTMENTS: Record<string, DispatchDepartment> = {
  ndma: {
    id: 'ndma',
    name: 'NDMA',
    email: process.env.DISPATCH_EMAIL_NDMA ?? 'ndma@disaster-response.pk',
    description: 'National Disaster Management Authority',
  },
  pdma: {
    id: 'pdma',
    name: 'PDMA',
    email: process.env.DISPATCH_EMAIL_PDMA ?? 'pdma@disaster-response.pk',
    description: 'Provincial Disaster Management Authority',
  },
  municipal: {
    id: 'municipal',
    name: 'Municipal Corporation',
    email: process.env.DISPATCH_EMAIL_MUNICIPAL ?? 'municipal@disaster-response.pk',
    description: 'Local municipal emergency coordination',
  },
  wapda: {
    id: 'wapda',
    name: 'WAPDA',
    email: process.env.DISPATCH_EMAIL_WAPDA ?? 'wapda@disaster-response.pk',
    description: 'Power / utility emergency response',
  },
  wasa: {
    id: 'wasa',
    name: 'WASA',
    email: process.env.DISPATCH_EMAIL_WASA ?? 'wasa@disaster-response.pk',
    description: 'Water and sewerage emergency response',
  },
}

const EMERGENCY_DEPARTMENT_IDS: Record<string, string[]> = {
  earthquake: ['ndma', 'pdma', 'municipal'],
  flood: ['ndma', 'pdma', 'municipal', 'wasa', 'wapda'],
  landslide: ['ndma', 'pdma', 'municipal'],
  cyclone: ['ndma', 'pdma', 'municipal', 'wapda'],
  fire: ['ndma', 'pdma', 'municipal', 'wapda'],
  accident: ['pdma', 'municipal'],
  other: ['ndma', 'pdma', 'municipal'],
}

export function getDepartmentsForEmergencyType(emergencyType: string): DispatchDepartment[] {
  const ids = EMERGENCY_DEPARTMENT_IDS[emergencyType] ?? EMERGENCY_DEPARTMENT_IDS.other
  return ids.map(id => DISPATCH_DEPARTMENTS[id]).filter(Boolean)
}
