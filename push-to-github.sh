#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

REPO_URL="https://github.com/SaadWaheed10/react-native-smart-theme.git"

echo "→ Cleaning partial .git (if any)"
rm -rf .git

echo "→ Initializing repository"
git init -b main

echo "→ Staging files"
git add -A

echo "→ Creating initial commit"
git commit -m "$(cat <<'EOF'
Initial release: react-native-smart-theme 0.1.0

Advanced dark/light theming for Expo and React Native CLI —
one-seed palettes, image→theme, Material You, adaptive text,
accessibility, animated transitions, and themed primitives.
EOF
)"

echo "→ Adding remote origin"
git remote add origin "$REPO_URL"

echo "→ Pushing to GitHub"
git push -u origin main

echo ""
echo "✅ Done: $REPO_URL"
echo "You can delete this script afterward: rm push-to-github.sh"
