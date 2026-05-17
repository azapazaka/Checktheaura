import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const sig = req.headers['stripe-signature']
  let event: Stripe.Event

  try {
    // Vercel parses the body by default, but Stripe needs raw body.
    // For Vercel, we can access raw body via req.body (if configured in vercel.json) or handle it manually.
    // We'll assume raw body is available as a Buffer in req.body for this example,
    // or stringified.
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature verification failed:', message)
    return res.status(400).send(`Webhook Error: ${message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id

    if (userId) {
      // Update the user's profile to PRO status
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          stripe_customer_id: session.customer as string,
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user to PRO:', error)
        return res.status(500).json({ error: 'Database update failed' })
      }
    }
  }

  res.status(200).json({ received: true })
}
