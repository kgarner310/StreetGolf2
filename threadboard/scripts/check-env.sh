#!/usr/bin/env bash
# Validates all required Threadboard env vars are set.
# Sources threadboard/.env.local if it exists.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../threadboard/.env.local"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

REQUIRED_VARS=(
  REDIS_URL
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_FROM_NUMBER
  VAPID_EMAIL
  VAPID_PUBLIC_KEY
  VAPID_PRIVATE_KEY
)

OPTIONAL_VARS=(
  STORAGE_URL
)

pass=0
fail=0

check() {
  local var="$1"
  local optional="${2:-false}"
  if [[ -n "${!var:-}" ]]; then
    printf "  \033[32m✓\033[0m %-22s = %s\n" "$var" "***hidden***"
    ((pass++)) || true
  elif [[ "$optional" == "true" ]]; then
    printf "  \033[33m–\033[0m %-22s   (optional, not set)\n" "$var"
  else
    printf "  \033[31m✗\033[0m %-22s   MISSING\n" "$var"
    ((fail++)) || true
  fi
}

echo ""
echo "Threadboard environment check"
echo "────────────────────────────────────────"

for var in "${REQUIRED_VARS[@]}"; do
  check "$var"
done

echo ""
echo "Optional:"
for var in "${OPTIONAL_VARS[@]}"; do
  check "$var" true
done

echo "────────────────────────────────────────"

if [[ $fail -gt 0 ]]; then
  echo ""
  printf "  \033[31m%d missing var(s).\033[0m Copy threadboard/.env.example → threadboard/.env.local and fill in the blanks.\n" "$fail"
  echo ""
  exit 1
else
  echo ""
  printf "  \033[32mAll %d required vars present.\033[0m\n" "$pass"
  echo ""
fi
