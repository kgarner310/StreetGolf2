#!/usr/bin/env bash
# ============================================================
# SubRoute — One-time launch setup script
# Run this AFTER you have your Supabase + Stripe keys ready
# Usage: bash scripts/setup.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════╗"
echo "  ║   SubRoute — Launch Setup        ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Collect credentials ──────────────────────────────
echo -e "${YELLOW}Step 1: Enter your credentials${NC}"
echo "  (These stay local — never committed)"
echo ""

read -p "  Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "  Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "  Supabase Service Role Key (for migrations): " SUPABASE_SERVICE_KEY
read -p "  Stripe Publishable Key (pk_live_...): " STRIPE_PK
read -p "  Stripe Secret Key (sk_live_...): " STRIPE_SK
read -p "  Your app domain (e.g. subroute.vercel.app): " APP_DOMAIN

# ── Step 2: Write .env file ───────────────────────────────────
echo ""
echo -e "${YELLOW}Step 2: Writing .env file...${NC}"

cat > .env <<EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PK}
VITE_APP_URL=https://${APP_DOMAIN}

# Server-side only (never in VITE_ prefix, never committed)
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SK}
STRIPE_WEBHOOK_SECRET=whsec_replace_after_creating_webhook
EOF

echo -e "  ${GREEN}✓ .env written${NC}"

# ── Step 3: Run Supabase migration ────────────────────────────
echo ""
echo -e "${YELLOW}Step 3: Running database migration...${NC}"

if command -v supabase &> /dev/null; then
  echo "  Using Supabase CLI..."
  supabase db push --db-url "postgresql://postgres:${SUPABASE_SERVICE_KEY}@$(echo $SUPABASE_URL | sed 's/https:\/\///').pooler.supabase.com:5432/postgres"
else
  echo "  Supabase CLI not found — running migration via curl..."
  MIGRATION_SQL=$(cat supabase/migrations/001_subroute_schema.sql)
  curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$MIGRATION_SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" \
    | python3 -m json.tool
fi

echo -e "  ${GREEN}✓ Migration complete${NC}"

# ── Step 4: Create Supabase Storage bucket ───────────────────
echo ""
echo -e "${YELLOW}Step 4: Creating storage bucket for COI documents...${NC}"

curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"subroute-coi","name":"subroute-coi","public":false}' \
  | python3 -m json.tool 2>/dev/null || true

# Set storage RLS policy
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"CREATE POLICY \"Contractors upload own COI\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '"'"'subroute-coi'"'"' AND auth.uid()::text = (storage.foldername(name))[1]); CREATE POLICY \"Contractors read own COI\" ON storage.objects FOR SELECT USING (bucket_id = '"'"'subroute-coi'"'"' AND auth.uid()::text = (storage.foldername(name))[1]);"}' \
  > /dev/null 2>&1 || true

echo -e "  ${GREEN}✓ Storage bucket created${NC}"

# ── Step 5: Test Stripe Connect webhook readiness ─────────────
echo ""
echo -e "${YELLOW}Step 5: Stripe setup reminder${NC}"
echo "  After this script, go to:"
echo "  https://dashboard.stripe.com/webhooks/create"
echo "  Add endpoint: https://${APP_DOMAIN}/api/stripe-webhook"
echo "  Events to listen for:"
echo "    • payment_intent.succeeded"
echo "    • transfer.created"
echo "    • account.updated (Connect)"
echo "  Copy the webhook signing secret → update STRIPE_WEBHOOK_SECRET in .env"

# ── Step 6: Build ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Step 6: Building production bundle...${NC}"
npm ci && npm run build
echo -e "  ${GREEN}✓ Build complete → dist/${NC}"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  SubRoute is ready to deploy!                    ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Push to Vercel:  vercel --prod                  ║${NC}"
echo -e "${GREEN}║  Or deploy dist/  to any static host             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Add these env vars in Vercel dashboard too:${NC}"
echo "  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,"
echo "  VITE_STRIPE_PUBLISHABLE_KEY, VITE_APP_URL"
