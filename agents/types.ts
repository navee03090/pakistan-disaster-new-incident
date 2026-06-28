import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type EmergencyCategory =
  | 'Flood'
  | 'Fire'
  | 'Medical'
  | 'Earthquake'
  | 'Road Accident'
  | 'Gas Leak'
  | 'Building Collapse'

export interface IncidentAgentInput {
  text: string
  imageUrl?: string | null
  voiceTranscript?: string | null
}

export interface IncidentAgentOutput {
  location: string
  district: string
  emergencyType: string
  peopleAffected: number
  urgency: UrgencyLevel
  language: string
  summary: string
  reasoning: string
}

export interface ClassificationAgentInput {
  incident: IncidentAgentOutput
}

export interface ClassificationAgentOutput {
  category: EmergencyCategory
  confidence: number
  reasoning: string
}

export interface PriorityAgentInput {
  incident: IncidentAgentOutput
  classification: ClassificationAgentOutput
}

export interface PriorityAgentOutput {
  priority: PriorityLevel
  score: number
  reason: string
  reasoning: string
}

export interface ResourceAgentInput {
  incident: IncidentAgentOutput
  classification: ClassificationAgentOutput
  priority: PriorityAgentOutput
}

export interface ResourceAgentOutput {
  resources: string[]
  estimatedArrival: string
  reasoning: string
}

export interface CommunicationAgentInput {
  incident: IncidentAgentOutput
  classification: ClassificationAgentOutput
  priority: PriorityAgentOutput
  resources: ResourceAgentOutput
}

export interface CommunicationAgentOutput {
  citizenMessage: string
  governmentReport: string
  dispatchInstructions: string
}

export interface AnalyticsAgentOutput {
  activeCases: number
  resolvedCases: number
  avgResponseTime: string
  highRiskDistricts: string[]
}

export interface ReasoningBreakdown {
  incident: string
  classification: string
  priority: string
  resources: string
}

export interface OrchestratorInput extends IncidentAgentInput {}

export interface OrchestratorOutput {
  incident: IncidentAgentOutput
  classification: ClassificationAgentOutput
  priority: PriorityAgentOutput
  resources: ResourceAgentOutput
  communication: CommunicationAgentOutput
  analytics?: AnalyticsAgentOutput
  reasoningBreakdown: ReasoningBreakdown
}

export interface OrchestratorContext {
  supabase?: SupabaseClient<Database>
  incidentId?: string
}

export type SupabaseClientType = SupabaseClient<Database>
