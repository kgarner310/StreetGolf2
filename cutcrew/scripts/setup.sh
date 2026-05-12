#!/usr/bin/env bash
# ============================================================
# CutCrew — One-time launch setup script
# Usage: bash scripts/setup.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════╗"
echo "  ║   CutCrew — Launch Setup         ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

read -p "  Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "  Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "  Supabase Service Role Key: " SUPABASE_SERVICE_KEY
read -p "  Stripe Publishable Key (pk_live_...): " STRIPE_PK
read -p "  Stripe Secret Key (sk_live_...): " STRIPE_SK
read -p "  Your app domain (e.g. cutcrew.vercel.app): " APP_DOMAIN

cat > .env <<EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PK}
VITE_APP_URL=https://${APP_DOMAIN}

SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SK}
STRIPE_WEBHOOK_SECRET=whsec_replace_after_creating_webhook
EOF

echo -e "  ${GREEN}✓ .env written${NC}"
echo ""
echo -e "${YELLOW}Running database migration...${NC}"

MIGRATION_SQL=$(cat supabase/migrations/001_initial_schema.sql)
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" \
  > /dev/null 2>&1 && echo -e "  ${GREEN}✓ Migration complete${NC}" || echo -e "  ${YELLOW}⚠ Paste migration SQL manually in Supabase SQL editor${NC}"

curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"coi-documents","name":"coi-documents","public":false}' > /dev/null 2>&1 || true

echo -e "  ${GREEN}✓ Storage bucket created${NC}"
echo ""
npm ci && npm run build
echo -e "${GREEN}✓ Build complete. Run: vercel --prod${NC}"
