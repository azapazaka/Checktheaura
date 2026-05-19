import { z } from 'zod'
import { buildFallbackCoachAnalysis } from './fallback.js'
import type { CoachAnalyzeRequest, CoachAnalyzeResponse } from './types.js'

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

const COACH_SYSTEM_PROMPT = `You are an elite, highly analytical checkers coach. Your task is to analyze a game of checkers played by a user against an AI and provide a structured, professional, and insightful critique in Russian.

You MUST respond with a strictly formatted JSON object matching the following TypeScript schema:
{
  "highlights": [string, string], // EXACTLY 2 concise, positive statements about the user's strong strategic points or good play decisions during the match.
  "mistakes": Array<{
    "turnNumber": number,          // The 1-based turn number where the mistake occurred (from the moves log).
    "madeMove": { 
      "from": { "row": number, "col": number }, 
      "to": { "row": number, "col": number } 
    },
    "betterMove": { 
      "from": { "row": number, "col": number }, 
      "to": { "row": number, "col": number } 
    },
    "explanation": string          // Clear, educational explanation in Russian explaining why the user's move was a mistake and why the alternative move was strategically superior.
  }>,
  "tip": string,                   // A high-level, actionable piece of strategic checkers advice in Russian based on the general patterns observed in this game (e.g., control of the center, protecting flanks, anticipating forks/double-jumps).
  "score": number                  // An overall evaluation score of the user's performance, from 1 (poor) to 10 (flawless).
}

CRITICAL CONSTRAINTS:
1. Your entire response must be a single, valid JSON object. Do not wrap it in markdown code blocks like \`\`\`json. Return ONLY the raw JSON string.
2. All text (highlights, explanations, tips) must be in Russian.
3. Keep the tone professional, educational, and encouraging.
4. Focus your mistakes analysis on actual tactical errors (such as missing a jump, walking into a double-jump, letting the opponent get a King unnecessarily, or giving up control of the center diagonal). If the player played very well and there are no notable tactical mistakes, you may leave the "mistakes" array empty.`;

function buildUserPrompt(payload: CoachAnalyzeRequest) {
  return JSON.stringify({
    playerColor: payload.playerColor,
    difficulty: payload.difficulty,
    outcome: {
      winner: payload.result.winner ?? 'draw',
      reason: payload.result.reason,
    },
    xpEarned: payload.xpSummary.total,
    movesLog: payload.moves.map((m) => ({
      turn: m.turn,
      player: m.player,
      from: m.from,
      to: m.to,
      captured: m.captured,
      promoted: m.promoted,
    })),
  }, null, 2)
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
            role: 'system',
            content: COACH_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: buildUserPrompt(payload),
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
      system: COACH_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(payload),
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
