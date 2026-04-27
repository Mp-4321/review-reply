import Stripe from 'stripe'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  const user = await currentUser()
  if (!user) return Response.json({ status: 'unauthenticated' })

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return Response.json({ status: 'no_subscription' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  try {
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) return Response.json({ status: 'no_subscription' })

    const customerId = customers.data[0].id

    const active = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })
    if (active.data.length) return Response.json({ status: 'active' })

    const trialing = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 })
    if (trialing.data.length) return Response.json({ status: 'trialing' })

    return Response.json({ status: 'expired' })
  } catch {
    return Response.json({ status: 'no_subscription' })
  }
}
