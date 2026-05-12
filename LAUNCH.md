# Launch Checklist — SubRoute + CutCrew

## What's already done (code is production-ready)
- [x] Full React + Vite + Tailwind builds for both apps
- [x] Complete Supabase schemas with RLS on every table
- [x] Stripe webhook edge functions (auto-release escrow)
- [x] Non-solicitation agreement system (SubRoute)
- [x] pg_cron auto-release migrations
- [x] Vercel deployment configs with security headers
- [x] Setup scripts (`scripts/setup.sh`)

---

## Your 4 manual steps (15 minutes total)

### Step 1 — Supabase (free tier is enough for launch)
1. Go to: https://supabase.com/dashboard
2. Click "New project" → name it `subroute` (and another `cutcrew`)
3. Choose a region closest to Texas (US East or US Central)
4. Copy from Project Settings → API:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret)
5. Go to SQL Editor → paste contents of:
   - `subroute/supabase/migrations/001_subroute_schema.sql`
   - `subroute/supabase/migrations/002_cron_auto_release.sql` (enable pg_cron first in Extensions)
6. Go to Storage → create bucket named `subroute-coi` → set to private
7. Repeat for CutCrew with `cutcrew/supabase/migrations/`

### Step 2 — Stripe
1. Go to: https://dashboard.stripe.com/register
2. Add your SoFi Mastercard as a payout bank (Settings → Bank accounts)
3. Enable Stripe Connect: https://dashboard.stripe.com/connect/accounts/overview
   - Choose "Platform or marketplace"
   - Standard accounts (providers connect their own bank)
4. Copy from Developers → API keys:
   - Publishable key (`pk_live_...`)
   - Secret key (`sk_live_...`)
5. After deploy, add webhook endpoint (see Step 4)

### Step 3 — Deploy to Vercel (free)
1. Go to: https://vercel.com/new
2. Import `kgarner310/StreetGolf2` from GitHub
3. For SubRoute:
   - Root directory: `subroute`
   - Framework: Vite
   - Add env vars (from Step 1+2)
4. Repeat for CutCrew with root directory `cutcrew`

### Step 4 — Wire Stripe webhooks
After deploy, go to https://dashboard.stripe.com/webhooks/create and add:

**SubRoute:**
- Endpoint: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook`
- Events: `payment_intent.succeeded`, `transfer.created`, `account.updated`

**CutCrew:**
- Same but for CutCrew's Supabase project

Then deploy the edge functions:
```bash
cd subroute
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...

cd ../cutcrew
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Environment variables needed

### SubRoute (`subroute/.env`)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://subroute.vercel.app
```

### CutCrew (`cutcrew/.env`)
```
VITE_SUPABASE_URL=https://yyy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://cutcrew.vercel.app
```

---

## Codex/Claude prompts for remaining features

Use these prompts in a new Claude Code or Codex session:

### Prompt 1 — Stripe Connect onboarding flow
```
In /subroute/src/pages/Onboarding.jsx, add a Step 3 after the COI upload step 
that triggers Stripe Connect onboarding. When the user clicks "Connect bank account", 
call a Supabase edge function at /functions/v1/create-connect-account that:
1. Creates a Stripe Connect standard account via stripe.accounts.create
2. Creates an account link via stripe.accountLinks.create with refresh_url and return_url
3. Returns the URL
Then redirect the user to that URL. On return, check account.charges_enabled 
and mark the contractor as ready.
```

### Prompt 2 — Email notifications
```
In the Supabase project for SubRoute, create an edge function at 
/functions/v1/send-notification that uses Resend (resend.com) to send emails:
- When a new claim is submitted: email the primary contractor
- When a claim is approved: email the fill-in contractor  
- When the non-solicitation is signed: email both parties a PDF copy
- When a job is marked complete: email both with payment confirmation
Use the Resend API. Get RESEND_API_KEY from Supabase secrets.
```

### Prompt 3 — SMS alerts for coverage urgency
```
Add Twilio SMS notifications to SubRoute's Supabase edge functions.
When a coverage job is posted with coverage_date within 24 hours of now, 
send an SMS to all verified contractors in the same zip_code who have 
preferred_role = 'fillin' or 'both'. Use twilio-node SDK.
Store TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER as Supabase secrets.
```

### Prompt 4 — Admin dashboard
```
Create /subroute/src/pages/Admin.jsx — a simple admin page accessible only 
to users whose email matches VITE_ADMIN_EMAIL env var. Show:
- Total contractors (verified vs pending)
- Total coverage jobs by status this month
- Total platform revenue (sum of platform_fee from payments where status=released)
- A table of pending verifications with an "Approve" button that sets is_verified=true
Use Supabase service role RLS bypass for admin queries.
```

### Prompt 5 — Mobile app (React Native)
```
Convert /subroute/src into a React Native Expo app. 
Reuse all hooks (useAuth, useCoverageJobs, useProfile) unchanged.
Replace react-router-dom with @react-navigation/native.
Replace Tailwind CSS with StyleSheet objects matching the same dark slate color scheme.
Keep jsPDF for non-solicitation agreement — use expo-sharing to share the PDF.
Target iOS and Android. The most critical screen is JobBoard with the claim flow.
```

---

## Cost estimate at launch (monthly)

| Service | Free tier | Paid threshold |
|---|---|---|
| Supabase | 500MB DB, 1GB storage, 50k auth users | ~$25/mo after |
| Vercel | 100GB bandwidth, unlimited deploys | ~$20/mo after |
| Stripe | 2.9% + 30¢ per transaction | Pay-as-you-go |
| Stripe Connect | 0.25% + 25¢ per payout | Pay-as-you-go |
| Resend (email) | 3,000 emails/mo | $20/mo after |
| Twilio (SMS) | $15 credit to start | ~$0.0079/SMS |

**Total at zero users: $0/month**
**Total at 100 jobs/month: ~$15 in Stripe fees + $0 infra**
