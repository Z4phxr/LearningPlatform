import Anthropic from '@anthropic-ai/sdk'
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages'
import { z } from 'zod'

import { aiProviderSchema } from './schemas'

const providerRequestSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().optional(),
  system: z.string().min(1),
  user: z.string().min(1),
})

type ProviderRequest = z.infer<typeof providerRequestSchema>

async function callAnthropic(req: ProviderRequest): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) throw new Error('ANTHROPIC_API_KEY is missing')
  const model =
    req.model?.trim() ||
    process.env.ANTHROPIC_SONNET_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    'claude-sonnet-4-5'
  const client = new Anthropic({ apiKey: key })
  const res = await client.messages.create({
    model,
    max_tokens: 8192,
    system: req.system,
    messages: [{ role: 'user', content: req.user }],
  })
  return res.content
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

async function callOpenAI(req: ProviderRequest): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error('OPENAI_API_KEY is missing')
  const model = req.model?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-4.1'
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: req.system }] },
        { role: 'user', content: [{ type: 'input_text', text: req.user }] },
      ],
      text: { format: { type: 'text' } },
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${txt}`)
  }
  const data = (await res.json()) as {
    output_text?: string
  }
  const out = data.output_text?.trim()
  if (!out) throw new Error('OpenAI returned empty output_text')
  return out
}

export async function generateText(req: ProviderRequest): Promise<string> {
  const parsed = providerRequestSchema.parse(req)
  if (parsed.provider === 'anthropic') return callAnthropic(parsed)
  return callOpenAI(parsed)
}

export function parseJsonText<T>(txt: string): T {
  const tryParse = (input: string): T => JSON.parse(input) as T

  try {
    return tryParse(txt)
  } catch {
    const fenced = txt
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    try {
      return tryParse(fenced)
    } catch {
      const firstBrace = txt.indexOf('{')
      const lastBrace = txt.lastIndexOf('}')
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const sliced = txt.slice(firstBrace, lastBrace + 1)
        return tryParse(sliced)
      }
      throw new Error('Unable to parse JSON from model output')
    }
  }
}
