import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { review } = (await request.json()) as { review: string }

    if (!review?.trim()) {
      return Response.json({ keywords: [] })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: `Extract 3-4 specific topic keywords from this review — the concrete subjects the customer mentions (e.g. "equipment", "waiting time", "staff", "cleanliness"). Return ONLY a JSON array of lowercase strings, nothing else.\n\nReview: "${review.trim()}"`,
        },
      ],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    const keywords = JSON.parse(text)
    return Response.json({ keywords: Array.isArray(keywords) ? keywords : [] })
  } catch {
    return Response.json({ keywords: [] })
  }
}
