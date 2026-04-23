import Anthropic from '@anthropic-ai/sdk'

const TONE_LABELS: Record<string, string> = {
  professional: 'professional and formal',
  warm: 'warm, friendly and personal',
  direct: 'direct, concise and to the point',
}

const SYSTEM_PROMPT = `You are a customer care expert helping business owners craft replies to Google reviews.

Before writing, infer the review's sentiment from its content and adjust your reply style accordingly:
- Positive (4–5 star feel): be enthusiastic and grateful, echo what the customer loved
- Negative (1–2 star feel): lead with genuine empathy, acknowledge the specific issue, and invite the customer to resolve it directly
- Neutral (3 star feel): appreciate the feedback while constructively addressing the concern

Rules:
- Always reply in the same language as the review — detect it automatically and match it exactly
- Personalize the reply based on the specific content of the review — never be generic
- If a tone is specified, apply it precisely; otherwise let the detected sentiment guide the tone naturally
- If a business name is provided: include it once naturally in plain text (no markdown, no bold, no formatting); also infer the type of business from the name and adapt your vocabulary and context accordingly (e.g. "Hotel Bella Vista" → hospitality language, "Studio Dentistico Rossi" → professional medical language, "Palestra FitZone" → fitness and wellness language, "Ristorante Da Mario" → restaurant language)
- Never use markdown formatting of any kind — no bold, no italics, no symbols
- Keep the reply to 4–5 lines maximum regardless of tone — this applies to all tones including Professional
- If the tone is "direct, concise and to the point": aim for 2–3 lines, no filler phrases, no emoji
- Respond with the reply text ONLY — no introduction, title, or commentary`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { review, tone, business } = body as {
      review: string
      tone?: string
      business?: string
    }

    if (!review?.trim()) {
      return Response.json({ error: 'Missing review' }, { status: 400 })
    }

    const toneLabel = tone ? (TONE_LABELS[tone] ?? tone) : null

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const userContent = [
      `Review received:\n"${review.trim()}"`,
      toneLabel ? `Requested tone: ${toneLabel}` : null,
      business?.trim() ? `Business name: ${business.trim()}` : null,
      'Write the reply to this review.',
    ]
      .filter(Boolean)
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userContent }],
    })

    const reply = message.content
      .filter((b: Anthropic.ContentBlock): b is Anthropic.TextBlock => b.type === 'text')
      .map((b: Anthropic.TextBlock) => b.text)
      .join('')

    return Response.json({ reply })
  } catch (error) {
    console.error('Claude API error:', error)

    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'Too many requests, please try again shortly' }, { status: 429 })
    }

    return Response.json({ error: 'Failed to generate a reply' }, { status: 500 })
  }
}
