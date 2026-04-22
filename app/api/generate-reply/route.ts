import Anthropic from '@anthropic-ai/sdk'

const TONE_LABELS: Record<string, string> = {
  professionale: 'professionale e formale',
  caloroso: 'caloroso, amichevole e personale',
  diretto: 'diretto, sintetico e al punto',
}

// Sistema stabile → viene messo in cache prompt (ephemeral)
const SYSTEM_PROMPT = `Sei un esperto di customer care per attività italiane. Il tuo compito è scrivere risposte alle recensioni Google in italiano, come se fossi il titolare dell'attività.

Regole:
- Scrivi sempre in italiano corretto e naturale
- Personalizza la risposta in base al contenuto specifico della recensione (non essere generico)
- Ringrazia il cliente e, se ha lasciato un feedback negativo, mostra empatia e proponi una soluzione
- Adatta perfettamente il registro al tono richiesto
- Non superare le 80-120 parole
- Rispondi ESCLUSIVAMENTE con il testo della risposta, senza introduzioni, titoli o commenti`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { business, review, tone } = body as {
      business: string
      review: string
      tone: string
    }

    if (!business?.trim() || !review?.trim() || !tone) {
      return Response.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    const toneLabel = TONE_LABELS[tone] ?? 'professionale'

    console.log("API KEY:", process.env.ANTHROPIC_API_KEY)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
      messages: [
        {
          role: 'user',
          content: `Attività: ${business.trim()}

Recensione ricevuta:
"${review.trim()}"

Tono richiesto: ${toneLabel}

Scrivi la risposta alla recensione.`,
        },
      ],
    })

    const reply = message.content
      .filter((b: Anthropic.ContentBlock): b is Anthropic.TextBlock => b.type === 'text')
      .map((b: Anthropic.TextBlock) => b.text)
      .join('')

    return Response.json({ reply })
  } catch (error) {
    console.error('Errore API Claude:', error)

    if (error instanceof Anthropic.AuthenticationError) {
      console.error('AuthenticationError:', JSON.stringify(error, null, 2))
      return Response.json({ error: 'API key non valida' }, { status: 401 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      console.error('RateLimitError:', JSON.stringify(error, null, 2))
      return Response.json({ error: 'Troppe richieste, riprova tra poco' }, { status: 429 })
    }

    console.error('Errore generico:', JSON.stringify(error, null, 2))
    return Response.json({ error: 'Errore nella generazione della risposta' }, { status: 500 })
  }
}
