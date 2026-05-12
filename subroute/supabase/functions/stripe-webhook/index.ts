// SubRoute — Stripe webhook handler (Supabase Edge Function)
// Deploy: supabase functions deploy stripe-webhook
// Set secrets: supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...

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
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  switch (event.type) {

    // ── Customer paid — move payment to escrowed ──────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const contractId = pi.metadata?.contract_id
      if (!contractId) break

      await supabase
        .from('payments')
        .update({ status: 'escrowed', stripe_payment_intent_id: pi.id })
        .eq('contract_id', contractId)

      // Also move job to active
      await supabase
        .from('coverage_jobs')
        .update({ status: 'active' })
        .eq('id', pi.metadata?.job_id)

      break
    }

    // ── Transfer to fill-in succeeded — mark released ─────────
    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer
      const contractId = transfer.metadata?.contract_id
      if (!contractId) break

      await supabase
        .from('payments')
        .update({ status: 'released', released_at: new Date().toISOString(), stripe_transfer_id: transfer.id })
        .eq('contract_id', contractId)

      break
    }

    // ── Connect account updated — check if onboarding complete ─
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.charges_enabled && account.payouts_enabled) {
        // Find the contractor with this stripe account and mark ready
        await supabase
          .from('contractor_profiles')
          .update({ stripe_account_id: account.id })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    // ── Auto-release after 24h: payment_intent with no dispute ─
    // (This is triggered by a Supabase cron job, not Stripe)

    default:
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
