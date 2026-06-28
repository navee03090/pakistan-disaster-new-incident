import { callLLM } from '@/lib/llm'
import { INCIDENT_SYSTEM_PROMPT } from '@/lib/prompts/incident.prompt'
import type { IncidentAgentInput, IncidentAgentOutput, UrgencyLevel } from './types'

const FALLBACK: IncidentAgentOutput = {
  location: 'Unknown location',
  district: 'Unknown',
  emergencyType: 'General Emergency',
  peopleAffected: 0,
  urgency: 'Medium',
  language: 'English',
  summary: 'Emergency reported. Awaiting further details.',
  reasoning: 'Limited input signals available; default values assigned pending verification.',
}

function buildUserInput(input: IncidentAgentInput): string {
  const parts = [`Report text:\n${input.text}`]
  if (input.voiceTranscript) {
    parts.push(`Voice transcript:\n${input.voiceTranscript}`)
  }
  if (input.imageUrl) {
    parts.push(`Image URL provided: ${input.imageUrl}`)
  }
  return parts.join('\n\n')
}

function buildFallback(input: IncidentAgentInput): IncidentAgentOutput {
  const text = `${input.text} ${input.voiceTranscript ?? ''}`.toLowerCase()
  const urgency: UrgencyLevel =
    text.includes('critical') || text.includes('trapped') || text.includes('collapse')
      ? 'Critical'
      : text.includes('urgent') || text.includes('injured') || text.includes('fire')
        ? 'High'
        : text.includes('minor')
          ? 'Low'
          : 'Medium'

  const peopleMatch = text.match(/(\d+)\s*(people|person|families|villagers)/)
  const peopleAffected = peopleMatch ? parseInt(peopleMatch[1], 10) : 0

  const language =
    /[\u0600-\u06FF]/.test(text) ? 'Urdu' : 'English'

  const signals: string[] = []
  if (input.text) signals.push('text report')
  if (input.voiceTranscript) signals.push('voice transcript')
  if (input.imageUrl) signals.push('image')

  return {
    location: 'Location pending verification',
    district: 'Pending',
    emergencyType: text.includes('flood')
      ? 'Flood'
      : text.includes('fire')
        ? 'Fire'
        : text.includes('earthquake')
          ? 'Earthquake'
          : 'General Emergency',
    peopleAffected,
    urgency,
    language,
    summary: input.text.slice(0, 200) || FALLBACK.summary,
    reasoning: `${urgency} urgency assigned because keywords in ${signals.join(' and ')} indicate ${
      urgency === 'Critical' ? 'life-threatening conditions' : urgency === 'High' ? 'significant danger' : 'moderate concern'
    }. ${peopleAffected > 0 ? `${peopleAffected} people mentioned in report.` : 'No explicit casualty count found.'}`,
  }
}

function normalizeOutput(raw: IncidentAgentOutput): IncidentAgentOutput {
  const urgencyValues: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Critical']
  const urgency = urgencyValues.includes(raw.urgency as UrgencyLevel)
    ? (raw.urgency as UrgencyLevel)
    : 'Medium'

  return {
    location: String(raw.location || FALLBACK.location),
    district: String(raw.district || FALLBACK.district),
    emergencyType: String(raw.emergencyType || FALLBACK.emergencyType),
    peopleAffected: Math.max(0, Number(raw.peopleAffected) || 0),
    urgency,
    language: String(raw.language || FALLBACK.language),
    summary: String(raw.summary || FALLBACK.summary),
    reasoning: String(raw.reasoning || FALLBACK.reasoning),
  }
}

export async function incidentAgent(
  input: IncidentAgentInput
): Promise<IncidentAgentOutput> {
  const fallback = buildFallback(input)
  const result = await callLLM<IncidentAgentOutput>(
    {
      systemPrompt: INCIDENT_SYSTEM_PROMPT,
      userInput: buildUserInput(input),
      imageUrl: input.imageUrl,
    },
    fallback
  )
  return normalizeOutput(result)
}
