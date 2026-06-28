export interface LLMRequest {
  systemPrompt: string
  userInput: string
  imageUrl?: string | null
}

const OPENROUTER_API_URL =
  process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1/chat/completions'

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'

const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE ??
  'https://generativelanguage.googleapis.com/v1beta'

function stripMarkdownJson(content: string): string {
  return content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export function parseJsonSafely<T extends object>(
  content: string,
  fallback: T
): T {
  try {
    const parsed = JSON.parse(stripMarkdownJson(content))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return fallback
    }
    return { ...fallback, ...parsed } as T
  } catch {
    return fallback
  }
}

async function buildGeminiImagePart(
  imageUrl: string
): Promise<{ inlineData: { mimeType: string; data: string } } | { text: string }> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { text: `Image URL (could not fetch): ${imageUrl}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const mimeType = response.headers.get('content-type') ?? 'image/jpeg'

    return {
      inlineData: {
        mimeType,
        data: buffer.toString('base64'),
      },
    }
  } catch {
    return { text: `Image URL: ${imageUrl}` }
  }
}

async function callGemini<T extends object>(
  request: LLMRequest,
  fallback: T
): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: request.userInput },
    ]

    if (request.imageUrl) {
      parts.push(await buildGeminiImagePart(request.imageUrl))
    }

    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LLM] Gemini error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    const content: string | undefined =
      data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) return null

    return parseJsonSafely(content, fallback)
  } catch (error) {
    console.error('[LLM] Gemini request failed:', error)
    return null
  }
}

async function callOpenRouter<T extends object>(
  request: LLMRequest,
  fallback: T
): Promise<T | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const userContent = request.imageUrl
      ? [
          { type: 'text', text: request.userInput },
          { type: 'image_url', image_url: { url: request.imageUrl } },
        ]
      : request.userInput

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'Pakistan Disaster Response AI Command Center',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LLM] OpenRouter error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    const content: string | undefined = data.choices?.[0]?.message?.content

    if (!content) return null

    return parseJsonSafely(content, fallback)
  } catch (error) {
    console.error('[LLM] OpenRouter request failed:', error)
    return null
  }
}

export async function callLLM<T extends object>(
  request: LLMRequest,
  fallback: T
): Promise<T> {
  const provider = process.env.LLM_PROVIDER ?? 'auto'

  const tryGemini = provider === 'auto' || provider === 'gemini'
  const tryOpenRouter = provider === 'auto' || provider === 'openrouter'

  if (tryGemini) {
    const result = await callGemini(request, fallback)
    if (result) return result
  }

  if (tryOpenRouter) {
    const result = await callOpenRouter(request, fallback)
    if (result) return result
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.warn('[LLM] No GEMINI_API_KEY or OPENROUTER_API_KEY set — using deterministic fallback')
  } else {
    console.warn('[LLM] All configured providers failed — using deterministic fallback')
  }

  return fallback
}
