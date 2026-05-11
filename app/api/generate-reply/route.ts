import Anthropic from '@anthropic-ai/sdk'

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Use a professional and polished tone — clear, composed, and business-appropriate.',
  friendly:     'Use a friendly and approachable tone — upbeat, genuine, and personable.',
  warm:         'Use a warm and caring tone — empathetic, personal, and heartfelt.',
  casual:       'Use a casual and conversational tone — relaxed, natural, and human.',
  concise:      'Use a concise and direct tone — 2–3 lines max, no filler phrases, no pleasantries.',
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short:    'Keep the reply to 1–2 sentences.',
  balanced: 'Keep the reply to 3–4 sentences.',
  detailed: 'Write a full paragraph reply (5–7 sentences).',
}

const BASE_SYSTEM_PROMPT = `You are a customer care expert helping business owners craft replies to Google reviews.

Before writing, infer the review's sentiment from its content and adjust your reply style accordingly:
- Positive (4–5 star feel): be enthusiastic and grateful, echo what the customer loved
- Negative (1–2 star feel): lead with genuine empathy, acknowledge the specific issue, and invite the customer to resolve it directly
- Neutral (3 star feel): appreciate the feedback while constructively addressing the concern

Rules:
- Always reply in the same language as the review — detect it automatically and match it exactly
- Personalize the reply based on the specific content of the review — never be generic
- Never use markdown formatting of any kind — no bold, no italics, no symbols
- Respond with the reply text ONLY — no introduction, title, or commentary`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      review,
      tone,
      replyLength,
      businessDescription,
      signature,
      customInstructions,
    } = body as {
      review:              string
      tone?:               string
      replyLength?:        string
      businessDescription?: string
      signature?:          string
      customInstructions?: string
    }

    if (!review?.trim()) {
      return Response.json({ error: 'Missing review' }, { status: 400 })
    }

    // Build dynamic system prompt sections
    const systemSections: string[] = [BASE_SYSTEM_PROMPT]

    const toneKey = tone && TONE_INSTRUCTIONS[tone] ? tone : 'professional'
    systemSections.push(`Tone: ${TONE_INSTRUCTIONS[toneKey]}`)

    const lengthKey = replyLength && LENGTH_INSTRUCTIONS[replyLength] ? replyLength : 'balanced'
    systemSections.push(`Length: ${LENGTH_INSTRUCTIONS[lengthKey]}`)

    if (businessDescription?.trim()) {
      systemSections.push(`Business context: ${businessDescription.trim()}`)
    }

    if (customInstructions?.trim()) {
      systemSections.push(`Additional instructions:\n${customInstructions.trim()}`)
    }

    if (signature?.trim()) {
      systemSections.push(`After the reply, append this signature on a new line: ${signature.trim()}`)
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        {
          type:          'text',
          text:          systemSections.join('\n\n'),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role:    'user',
          content: `Review received:\n"${review.trim()}"\n\nWrite the reply to this review.`,
        },
      ],
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
