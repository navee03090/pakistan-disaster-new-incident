import { callLLM } from '@/lib/llm'
import { COMMUNICATION_SYSTEM_PROMPT } from '@/lib/prompts/communication.prompt'
import type { CommunicationAgentInput, CommunicationAgentOutput } from './types'

const FALLBACK: CommunicationAgentOutput = {
  citizenMessage:
    'Your emergency report has been received. NDMA response teams are being dispatched. Stay safe and await further instructions.',
  governmentReport:
    'Emergency incident logged. AI analysis complete. Dispatch and resource allocation initiated per priority protocol.',
  dispatchInstructions:
    'Deploy recommended resources immediately. Establish incident command post. Coordinate with local district administration.',
}

function buildFallback(input: CommunicationAgentInput): CommunicationAgentOutput {
  const { incident, classification, priority, resources } = input
  const resourceList = resources.resources.join(', ')

  return {
    citizenMessage:
      incident.language === 'Urdu'
        ? `آپ کی رپورٹ موصول ہو گئی۔ ${classification.category} واقعہ ${incident.district} میں رجسٹر ہوا۔ مدد راستے میں ہے۔`
        : `Your ${classification.category} report in ${incident.district} has been received. Help is on the way. ETA: ${resources.estimatedArrival}.`,
    governmentReport: `NDMA ALERT — ${classification.category} (${priority.priority} priority, score ${priority.score}/100) in ${incident.location}, ${incident.district}. ${incident.peopleAffected} people affected. ${incident.summary} Resources: ${resourceList}. Confidence: ${classification.confidence}%.`,
    dispatchInstructions: `Priority ${priority.priority}: Deploy ${resourceList} to ${incident.location}, ${incident.district}. ETA target: ${resources.estimatedArrival}. ${priority.reason} Establish perimeter, triage casualties, coordinate with PDMA ${incident.district}.`,
  }
}

function normalizeOutput(raw: CommunicationAgentOutput): CommunicationAgentOutput {
  return {
    citizenMessage: String(raw.citizenMessage || FALLBACK.citizenMessage),
    governmentReport: String(raw.governmentReport || FALLBACK.governmentReport),
    dispatchInstructions: String(
      raw.dispatchInstructions || FALLBACK.dispatchInstructions
    ),
  }
}

export async function communicationAgent(
  input: CommunicationAgentInput
): Promise<CommunicationAgentOutput> {
  const fallback = buildFallback(input)
  const result = await callLLM<CommunicationAgentOutput>(
    {
      systemPrompt: COMMUNICATION_SYSTEM_PROMPT,
      userInput: JSON.stringify(input),
    },
    fallback
  )
  return normalizeOutput(result)
}
