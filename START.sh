#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
npm ls --omit=dev --depth=0 >/dev/null 2>&1 || npm install
npm run dev
