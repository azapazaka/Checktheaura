import { z } from 'zod'
import { buildFallbackCoachAnalysis } from './fallback'
import type { CoachAnalyzeRequest, CoachAnalyzeResponse } from './types'

type CoachProvider = 'groq' | 'anthropic'

const moveSchema = z.object({
  from: z.object({ row: z.number(), col: z.number() }),
  to: z.object({ row: z.number(), col: z.number() }),
  captured: z.array(z.object({ row: z.number(), col: z.number() })),
  turn: z.number(),
  player: z.enum(['white', 'black']),
  pieceId: z.string(),
  promoted: z.boolean(),
})

export const coachAnalyzeRequestSchema = z.object({
  moves: z.array(moveSchema),
  result: z.object({
    winner: z.enum(['white', 'black']).nullable(),
    reason: z.enum(['captured-all', 'blocked', 'stalemate', 'fifty-move-rule']),
  }),
  playerColor: z.enum(['white', 'black']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  xpSummary: z.object({
    total: z.number(),
    breakdown: z.object({
      victory: z.number(),
      defeat: z.number(),
      captures: z.number(),
      king: z.number(),
      perfectGame: z.number(),
      hardDifficulty: z.number(),
      quickWin: z.number(),
      strategistBonus: z.number(),
      shadowHintValue: z.number(),
      playMatchQuest: z.number(),
      winMediumQuest: z.number(),
      crownKingQuest: z.number(),
    }),
  }),
})

function buildPrompt(payload: CoachAnalyzeRequest) {
  return [
    'Ты тренер по шашкам. Верни только строгий JSON с ключами highlights, mistakes, tip, score.',
    'highlights — массив из 2 строк, tip — одна практическая рекомендация, score — число от 1 до 10.',
    'mistakes — массив объектов (может быть пустым, если ошибок нет). Каждый объект должен иметь:',
    '  - turnNumber: номер хода из лога, где была совершена ошибка',
    '  - madeMove: { from: { row, col }, to: { row, col } } — какой ход сделал игрок',
    '  - betterMove: { from: { row, col }, to: { row, col } } — какой ход был бы лучше',
    '  - explanation: почему это ошибка (на русском)',
    `Игрок: ${payload.playerColor}`,
    `Сложность: ${payload.difficulty}`,
    `Итог: winner=${payload.result.winner ?? 'draw'}, reason=${payload.result.reason}`,
    `XP total: ${payload.xpSummary.total}`,
    `Ходы партии: ${JSON.stringify(payload.moves)}`,
  ].join('\n')
}

function extractTextResponse(data: unknown) {
  const candidate = z
    .object({
      content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
    })
    .safeParse(data)

  if (!candidate.success) {
    return null
  }

  return candidate.data.content
    .map((item) => item.text ?? '')
    .join('\n')
    .trim()
}

function extractGroqTextResponse(data: unknown) {
  const candidate = z
    .object({
      choices: z.array(
        z.object({
          message: z.object({
            content: z.union([z.string(), z.null()]).optional(),
          }),
        }),
      ),
    })
    .safeParse(data)

  if (!candidate.success) {
    return null
  }

  return candidate.data.choices
    .map((item) => item.message.content ?? '')
    .join('\n')
    .trim()
}

function parseCoachResponse(rawText: string) {
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  return z
    .object({
      highlights: z.array(z.string()).min(1),
      mistakes: z.array(z.object({
        turnNumber: z.number(),
        madeMove: z.object({
          from: z.object({ row: z.number(), col: z.number() }),
          to: z.object({ row: z.number(), col: z.number() }),
        }),
        betterMove: z.object({
          from: z.object({ row: z.number(), col: z.number() }),
          to: z.object({ row: z.number(), col: z.number() }),
        }),
        explanation: z.string()
      })),
      tip: z.string(),
      score: z.number(),
    })
    .parse(JSON.parse(cleaned)) as CoachAnalyzeResponse
}

async function makeRequest(
  provider: CoachProvider,
  apiKey: string,
  model: string,
  payload: CoachAnalyzeRequest,
  fetchImpl: typeof fetch,
): Promise<CoachAnalyzeResponse> {
  if (provider === 'groq') {
    const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: buildPrompt(payload),
          },
        ],
        response_format: {
          type: 'json_object',
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.status}`)
    }

    const data = await response.json()
    const text = extractGroqTextResponse(data)
    if (!text) {
      throw new Error('Groq response missing text')
    }

    return parseCoachResponse(text)
  }

  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: buildPrompt(payload),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status}`)
  }

  const data = await response.json()
  const text = extractTextResponse(data)
  if (!text) {
    throw new Error('Anthropic response missing text')
  }

  return parseCoachResponse(text)
}

export async function analyzeCoachPayload(
  input: unknown,
  options?: {
    fetchImpl?: typeof fetch
    apiKey?: string
    model?: string
    provider?: CoachProvider
  },
): Promise<CoachAnalyzeResponse> {
  const payload = coachAnalyzeRequestSchema.parse(input)
  const provider =
    options?.provider ??
    ((process.env.COACH_AI_PROVIDER?.toLowerCase() as CoachProvider | undefined) ??
      (process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_FALLBACK ? 'groq' : 'anthropic'))

  const fetchImpl = options?.fetchImpl ?? fetch
  const model =
    options?.model ??
    (provider === 'groq'
      ? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
      : process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514')

  const primaryApiKey =
    options?.apiKey ??
    (provider === 'groq' ? process.env.GROQ_API_KEY : process.env.ANTHROPIC_API_KEY)

  const fallbackApiKey =
    provider === 'groq' && !options?.apiKey ? process.env.GROQ_API_KEY_FALLBACK : undefined

  if (payload.moves.length === 0) {
    return buildFallbackCoachAnalysis(payload)
  }

  // Attempt with primary API key
  if (primaryApiKey) {
    try {
      return await makeRequest(provider, primaryApiKey, model, payload, fetchImpl)
    } catch (err) {
      console.warn(`Primary coach API key failed, checking for fallback...`, err)
    }
  }

  // Attempt with fallback API key if primary failed or was missing
  if (fallbackApiKey) {
    try {
      console.log(`Using fallback Groq API key...`)
      return await makeRequest(provider, fallbackApiKey, model, payload, fetchImpl)
    } catch (err) {
      console.error(`Fallback coach API key also failed:`, err)
    }
  }

  // Otherwise, return local ruleset fallback build
  return buildFallbackCoachAnalysis(payload)
}
