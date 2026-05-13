import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { limit = 30, force = false } = await req.json().catch(() => ({}))

  // Find stylists with Instagram handles that haven't been analyzed in 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 3600000).toISOString()

  const { data: stylists } = await supabase
    .from('stylists')
    .select('id, instagram_handle')
    .eq('is_active', true)
    .not('instagram_handle', 'is', null)
    .or(force ? 'id.is.not.null' : `instagram_last_scraped_at.is.null,instagram_last_scraped_at.lt.${cutoff}`)
    .order('instagram_last_scraped_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (!stylists?.length) return json({ processed: 0 })

  let processed = 0
  let failed = 0

  for (const stylist of stylists) {
    try {
      // Call the analyze-instagram function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ handle: stylist.instagram_handle }),
      })

      if (!res.ok) { failed++; continue }
      const { analysis } = await res.json()
      if (!analysis) { failed++; continue }

      // Write analysis results back to stylist row
      await supabase
        .from('stylists')
        .update({
          instagram_detected_services: analysis.detected_services ?? [],
          instagram_detected_textures: analysis.confirmed_textures ?? [],
          instagram_texture_tags: analysis.texture_tags ?? [],
          instagram_sentiment_score: analysis.sentiment_score ?? null,
          instagram_repeat_client_ratio: analysis.repeat_client_ratio ?? null,
          instagram_notable_comments: analysis.notable_comments ?? [],
          instagram_sample_photos: analysis.sample_photos ?? [],
          instagram_post_count: analysis.post_count ?? null,
          instagram_portfolio_quality: analysis.portfolio_quality_score ?? null,
          instagram_last_scraped_at: new Date().toISOString(),
        })
        .eq('id', stylist.id)

      processed++
    } catch {
      failed++
    }

    // Respect rate limits — OpenAI vision is expensive, space requests out
    await delay(2000)
  }

  return json({ processed, failed, total: stylists.length })
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
