import { callLLM } from '@/lib/llm'
import { CLASSIFICATION_SYSTEM_PROMPT } from '@/lib/prompts/classification.prompt'
import type {
  ClassificationAgentInput,
  ClassificationAgentOutput,
  EmergencyCategory,
} from './types'

const CATEGORIES: EmergencyCategory[] = [
  'Flood',
  'Fire',
  'Medical',
  'Earthquake',
  'Road Accident',
  'Gas Leak',
  'Building Collapse',
]

const FALLBACK: ClassificationAgentOutput = {
  category: 'Medical',
  confidence: 50,
  reasoning: 'Insufficient signals to classify with high confidence; defaulting to Medical.',
}

function inferCategory(incident: ClassificationAgentInput['incident']): EmergencyCategory {
  const text = `${incident.emergencyType} ${incident.summary}`.toLowerCase()
  if (text.includes('flood') || text.includes('water')) return 'Flood'
  if (text.includes('fire') || text.includes('blaze')) return 'Fire'
  if (text.includes('earthquake') || text.includes('tremor')) return 'Earthquake'
  if (text.includes('accident') || text.includes('collision')) return 'Road Accident'
  if (text.includes('gas') || text.includes('leak')) return 'Gas Leak'
  if (text.includes('collapse') || text.includes('building')) return 'Building Collapse'
  return 'Medical'
}

function buildFallback(input: ClassificationAgentInput): ClassificationAgentOutput {
  const category = inferCategory(input.incident)
  return {
    category,
    confidence: 72,
    reasoning: `Classified as ${category} based on emergency type "${input.incident.emergencyType}" and summary mentioning related keywords. ${input.incident.urgency} urgency in ${input.incident.district} supports this classification.`,
  }
}

function normalizeOutput(raw: ClassificationAgentOutput): ClassificationAgentOutput {
  const category = CATEGORIES.includes(raw.category as EmergencyCategory)
    ? (raw.category as EmergencyCategory)
    : FALLBACK.category

  const confidence = Math.min(100, Math.max(0, Number(raw.confidence) || 50))

  return { category, confidence, reasoning: String(raw.reasoning || FALLBACK.reasoning) }
}

export async function classificationAgent(
  input: ClassificationAgentInput
): Promise<ClassificationAgentOutput> {
  const fallback = buildFallback(input)
  const result = await callLLM<ClassificationAgentOutput>(
    {
      systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
      userInput: JSON.stringify(input.incident),
    },
    fallback
  )
  return normalizeOutput(result)
}
