#!/usr/bin/env bash
# Bootstrap script — run once on a fresh machine.
# Checks prerequisites, validates env vars, and installs fastlane.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
THREADBOARD_DIR="$ROOT_DIR/threadboard"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
ok()   { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "  ${YELLOW}!${RESET} %s\n" "$1"; }
fail() { printf "  ${RED}✗${RESET} %s\n" "$1"; }

echo ""
echo "Threadboard setup"
echo "════════════════════════════════════════"

# ── Prerequisites ─────────────────────────────────────────────────────────────
echo ""
echo "Checking prerequisites..."

node_version=$(node --version 2>/dev/null | sed 's/v//' || echo "")
if [[ -z "$node_version" ]]; then
  fail "Node.js not found — install from https://nodejs.org (v18+)"
  exit 1
fi
node_major=$(echo "$node_version" | cut -d. -f1)
if [[ "$node_major" -lt 18 ]]; then
  fail "Node.js v$node_version found — v18+ required"
  exit 1
fi
ok "Node.js v$node_version"

ruby_version=$(ruby --version 2>/dev/null | awk '{print $2}' || echo "")
if [[ -z "$ruby_version" ]]; then
  fail "Ruby not found — install via https://rbenv.org or brew install ruby"
  exit 1
fi
ruby_major=$(echo "$ruby_version" | cut -d. -f1)
if [[ "$ruby_major" -lt 3 ]]; then
  warn "Ruby $ruby_version found — Ruby 3+ recommended for fastlane"
else
  ok "Ruby $ruby_version"
fi

if ! command -v bundle &>/dev/null; then
  warn "Bundler not found — installing..."
  gem install bundler
fi
ok "Bundler $(bundle --version | awk '{print $3}')"

# ── Env file ──────────────────────────────────────────────────────────────────
echo ""
echo "Checking env vars..."

ENV_LOCAL="$THREADBOARD_DIR/.env.local"
ENV_EXAMPLE="$THREADBOARD_DIR/.env.example"

if [[ ! -f "$ENV_LOCAL" ]]; then
  warn ".env.local not found"
  echo ""
  read -rp "  Copy from .env.example to get started? [y/N] " answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    cp "$ENV_EXAMPLE" "$ENV_LOCAL"
    ok "Copied .env.example → .env.local — fill in the real values"
  else
    warn "Skipping — create threadboard/.env.local manually before running the app"
  fi
fi

if [[ -f "$ENV_LOCAL" ]]; then
  echo ""
  "$SCRIPT_DIR/check-env.sh" || {
    echo ""
    warn "Some vars are missing. Run ./scripts/generate-keys.sh to generate VAPID keys."
    echo ""
  }
fi

# ── fastlane ──────────────────────────────────────────────────────────────────
echo ""
echo "Installing fastlane..."

(cd "$ROOT_DIR" && bundle install --quiet)
ok "fastlane installed ($(cd "$ROOT_DIR" && bundle exec fastlane --version | tail -1))"

echo ""
echo "════════════════════════════════════════"
echo ""
echo "Setup complete. Next steps:"
echo ""
echo "  1. Fill in threadboard/.env.local with real values"
echo "  2. Fill in fastlane/Appfile with your bundle ID, Apple ID, and team ID"
echo "  3. Create a private GitHub repo: threadboard-certs"
echo "  4. Update fastlane/Matchfile with the repo URL"
echo "  5. Set MATCH_PASSWORD in your shell (used to encrypt certs)"
echo "  6. Run: bundle exec fastlane setup"
echo ""
echo "  For push notification entitlements (after RN project exists):"
echo "  Run: ./scripts/setup-ios.sh"
echo "       ./scripts/setup-ios.sh --production  (for App Store builds)"
echo ""
