// CutCrew — Stripe webhook handler (Supabase Edge Function)
// Deploy: supabase functions deploy stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  switch (event.type) {

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break

      await supabase.from('payments').update({
        status: 'escrowed',
        stripe_payment_intent_id: pi.id,
      }).eq('contract_id', contractId)

      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', pi.metadata?.job_id)
      break
    }

    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer
      const contractId = transfer.metadata?.contract_id
      if (!contractId) break

      await supabase.from('payments').update({
        status: 'released',
        released_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
      }).eq('contract_id', contractId)

      await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', transfer.metadata?.job_id)
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.charges_enabled) {
        await supabase.from('provider_profiles')
          .update({ stripe_account_id: account.id })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    default:
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
