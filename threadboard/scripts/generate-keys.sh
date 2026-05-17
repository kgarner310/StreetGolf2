#!/usr/bin/env bash
# Generates VAPID keys for web push notifications using the web-push CLI.
# Output is ready to paste into threadboard/.env.local
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THREADBOARD_DIR="$SCRIPT_DIR/../threadboard"

if [[ ! -d "$THREADBOARD_DIR/node_modules" ]]; then
  echo "Installing threadboard dependencies first..."
  (cd "$THREADBOARD_DIR" && npm install)
fi

echo ""
echo "Generating VAPID keys..."
echo ""

output=$(cd "$THREADBOARD_DIR" && npx web-push generate-vapid-keys --json 2>/dev/null)

public_key=$(echo "$output" | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
private_key=$(echo "$output" | grep -o '"privateKey":"[^"]*"' | cut -d'"' -f4)

echo "Add these to threadboard/.env.local:"
echo ""
echo "VAPID_EMAIL=mailto:you@example.com"
echo "VAPID_PUBLIC_KEY=$public_key"
echo "VAPID_PRIVATE_KEY=$private_key"
echo ""
echo "⚠  Keep VAPID_PRIVATE_KEY secret. Never commit it."
echo ""
