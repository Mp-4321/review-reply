import Stripe from 'stripe'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { priceId } = (await request.json()) as { priceId: string }

    if (!priceId) {
      return Response.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: 'http://localhost:3000?checkout=success',
      cancel_url: 'http://localhost:3000',
    })

    return Response.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
