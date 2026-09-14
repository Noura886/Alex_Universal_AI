#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  Alex - Universal AI  -  Launcher"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[X] Node.js is not installed on this computer."
  echo "Install it from https://nodejs.org/ (LTS version), then run this script again."
  exit 1
fi
echo "[OK] Node.js found."

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo "[!] Created a new .env file."
  echo "Open it now, add AT LEAST ONE key (OPENAI_API_KEY, GEMINI_API_KEY or ANTHROPIC_API_KEY),"
  echo "save it, then press Enter here to continue."
  read -r -p "Press Enter once you've saved .env..." _
else
  echo "[OK] .env already exists, keeping it as is."
fi

if [ ! -d "node_modules" ]; then
  echo
  echo "Installing dependencies, this can take a minute..."
  npm install
else
  echo "[OK] Dependencies already installed."
fi

echo
echo "Starting Alex..."
( sleep 2 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true) ) &
npm start
