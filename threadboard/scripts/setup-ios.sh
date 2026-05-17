#!/usr/bin/env bash
# Configures Xcode entitlements and Info.plist background modes for push
# notifications in the React Native ios/ project.
# Run after: npx react-native init ThreadboardMobile --directory threadboard-mobile
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RN_DIR="$SCRIPT_DIR/../threadboard-mobile"
IOS_DIR="$RN_DIR/ios"
APS_ENV="development"

for arg in "$@"; do
  if [[ "$arg" == "--production" ]]; then
    APS_ENV="production"
  fi
done

if [[ ! -d "$IOS_DIR" ]]; then
  echo "Error: $IOS_DIR not found."
  echo "Run first: npx react-native@latest init ThreadboardMobile --directory threadboard-mobile"
  exit 1
fi

APP_NAME=$(ls "$IOS_DIR" | grep -v '\.xcodeproj\|\.xcworkspace\|Podfile\|build\|Tests' | head -1)
if [[ -z "$APP_NAME" ]]; then
  echo "Error: Could not detect app name inside $IOS_DIR"
  exit 1
fi

PLIST="$IOS_DIR/$APP_NAME/Info.plist"
ENTITLEMENTS="$IOS_DIR/$APP_NAME/$APP_NAME.entitlements"

echo ""
echo "Configuring iOS for push notifications"
echo "  App:          $APP_NAME"
echo "  APS env:      $APS_ENV"
echo "  Info.plist:   $PLIST"
echo "  Entitlements: $ENTITLEMENTS"
echo ""

# ── Background modes ──────────────────────────────────────────────────────────
if /usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$PLIST" &>/dev/null; then
  existing=$(/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" "$PLIST")
  if echo "$existing" | grep -q "remote-notification"; then
    echo "  ✓ UIBackgroundModes:remote-notification already set"
  else
    /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes: string remote-notification" "$PLIST"
    echo "  ✓ Added remote-notification to existing UIBackgroundModes"
  fi
else
  /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes: string remote-notification" "$PLIST"
  echo "  ✓ Created UIBackgroundModes with remote-notification"
fi

# ── Entitlements file ─────────────────────────────────────────────────────────
if [[ -f "$ENTITLEMENTS" ]]; then
  if /usr/libexec/PlistBuddy -c "Print :aps-environment" "$ENTITLEMENTS" &>/dev/null; then
    current=$(/usr/libexec/PlistBuddy -c "Print :aps-environment" "$ENTITLEMENTS")
    if [[ "$current" != "$APS_ENV" ]]; then
      /usr/libexec/PlistBuddy -c "Set :aps-environment $APS_ENV" "$ENTITLEMENTS"
      echo "  ✓ Updated aps-environment: $current → $APS_ENV"
    else
      echo "  ✓ aps-environment already set to $APS_ENV"
    fi
  else
    /usr/libexec/PlistBuddy -c "Add :aps-environment string $APS_ENV" "$ENTITLEMENTS"
    echo "  ✓ Added aps-environment=$APS_ENV to existing entitlements"
  fi
else
  cat > "$ENTITLEMENTS" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>aps-environment</key>
  <string>${APS_ENV}</string>
</dict>
</plist>
EOF
  echo "  ✓ Created $ENTITLEMENTS with aps-environment=$APS_ENV"
fi

echo ""
echo "Done. Next: open Xcode, go to Signing & Capabilities, add 'Push Notifications' capability"
echo "and set the entitlements file to: $APP_NAME/$APP_NAME.entitlements"
echo ""
