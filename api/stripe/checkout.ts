import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/profile?upgrade=success`,
      cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/pricing`,
      client_reference_id: userId,
    })

    return res.status(200).json({ url: session.url })
  } catch (error: unknown) {
    console.error('Stripe Checkout error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
  }
}
