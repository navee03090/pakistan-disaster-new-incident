import { callLLM } from '@/lib/llm'
import { RESOURCE_SYSTEM_PROMPT } from '@/lib/prompts/resource.prompt'
import type { ResourceAgentInput, ResourceAgentOutput } from './types'

const VALID_RESOURCES = [
  'Boat',
  'Ambulance',
  'Police',
  'Medical Team',
  'Food',
  'Shelter',
] as const

const FALLBACK: ResourceAgentOutput = {
  resources: ['Ambulance', 'Police'],
  estimatedArrival: '20-30 minutes',
  reasoning: 'Standard ambulance and police dispatch recommended as baseline emergency response.',
}

function resourcesForCategory(category: string, priority: string): string[] {
  const base: string[] = ['Ambulance', 'Police']

  if (category === 'Flood') base.unshift('Boat', 'Shelter', 'Food')
  if (category === 'Fire') base.push('Medical Team')
  if (category === 'Medical') base.push('Medical Team')
  if (category === 'Earthquake' || category === 'Building Collapse') {
    base.push('Medical Team', 'Shelter')
  }
  if (category === 'Road Accident') base.push('Medical Team')
  if (category === 'Gas Leak') base.push('Medical Team')

  if (priority === 'Critical' || priority === 'High') {
    if (!base.includes('Medical Team')) base.push('Medical Team')
  }

  return [...new Set(base.filter(r => VALID_RESOURCES.includes(r as typeof VALID_RESOURCES[number])))]
}

function buildFallback(input: ResourceAgentInput): ResourceAgentOutput {
  const resources = resourcesForCategory(
    input.classification.category,
    input.priority.priority
  )
  const eta =
    input.priority.priority === 'Critical'
      ? '10-15 minutes'
      : input.priority.priority === 'High'
        ? '15-25 minutes'
        : '30-45 minutes'

  return {
    resources,
    estimatedArrival: eta,
    reasoning: `${resources.join(', ')} selected for ${input.classification.category} with ${input.priority.priority} priority. ${input.classification.category === 'Flood' ? 'Boats and shelter needed for water rescue.' : 'Medical and security resources prioritized.'} ETA ${eta} based on urgency level and ${input.incident.district} location.`,
  }
}

function normalizeOutput(raw: ResourceAgentOutput): ResourceAgentOutput {
  const resources = Array.isArray(raw.resources)
    ? raw.resources.filter(r =>
        VALID_RESOURCES.includes(r as typeof VALID_RESOURCES[number])
      )
    : FALLBACK.resources

  return {
    resources: resources.length > 0 ? resources : FALLBACK.resources,
    estimatedArrival: String(raw.estimatedArrival || FALLBACK.estimatedArrival),
    reasoning: String(raw.reasoning || FALLBACK.reasoning),
  }
}

export async function resourceAgent(
  input: ResourceAgentInput
): Promise<ResourceAgentOutput> {
  const fallback = buildFallback(input)
  const result = await callLLM<ResourceAgentOutput>(
    {
      systemPrompt: RESOURCE_SYSTEM_PROMPT,
      userInput: JSON.stringify({
        incident: input.incident,
        classification: input.classification,
        priority: input.priority,
      }),
    },
    fallback
  )
  return normalizeOutput(result)
}
