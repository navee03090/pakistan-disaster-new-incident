import { callLLM } from '@/lib/llm'
import { PRIORITY_SYSTEM_PROMPT } from '@/lib/prompts/priority.prompt'
import type { PriorityAgentInput, PriorityAgentOutput, PriorityLevel } from './types'

const PRIORITIES: PriorityLevel[] = ['Critical', 'High', 'Medium', 'Low']

const FALLBACK: PriorityAgentOutput = {
  priority: 'Medium',
  score: 50,
  reason: 'Standard response priority assigned pending field verification.',
  reasoning: 'Medium priority assigned due to insufficient urgency signals in the available input.',
}

function urgencyToPriority(urgency: string): PriorityLevel {
  const map: Record<string, PriorityLevel> = {
    Critical: 'Critical',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
  }
  return map[urgency] ?? 'Medium'
}

function priorityToScore(priority: PriorityLevel): number {
  const scores: Record<PriorityLevel, number> = {
    Critical: 95,
    High: 78,
    Medium: 52,
    Low: 25,
  }
  return scores[priority]
}

function buildFallback(input: PriorityAgentInput): PriorityAgentOutput {
  const priority = urgencyToPriority(input.incident.urgency)
  const confidenceBoost = input.classification.confidence > 80 ? 5 : 0
  return {
    priority,
    score: Math.min(100, priorityToScore(priority) + confidenceBoost),
    reason: `${input.classification.category} incident in ${input.incident.district} with ${input.incident.urgency} urgency. ${input.incident.peopleAffected} people affected.`,
    reasoning: `${priority} priority because ${input.incident.urgency} urgency was detected, ${input.incident.peopleAffected} people are affected, and ${input.classification.category} (${input.classification.confidence}% confidence) indicates significant response need in ${input.incident.district}.`,
  }
}

function normalizeOutput(raw: PriorityAgentOutput): PriorityAgentOutput {
  const priority = PRIORITIES.includes(raw.priority as PriorityLevel)
    ? (raw.priority as PriorityLevel)
    : FALLBACK.priority

  return {
    priority,
    score: Math.min(100, Math.max(0, Number(raw.score) || priorityToScore(priority))),
    reason: String(raw.reason || FALLBACK.reason),
    reasoning: String(raw.reasoning || raw.reason || FALLBACK.reasoning),
  }
}

export async function priorityAgent(
  input: PriorityAgentInput
): Promise<PriorityAgentOutput> {
  const fallback = buildFallback(input)
  const result = await callLLM<PriorityAgentOutput>(
    {
      systemPrompt: PRIORITY_SYSTEM_PROMPT,
      userInput: JSON.stringify({
        incident: input.incident,
        classification: input.classification,
      }),
    },
    fallback
  )
  return normalizeOutput(result)
}
