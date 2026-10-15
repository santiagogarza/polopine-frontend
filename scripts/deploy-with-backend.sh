#!/usr/bin/env bash
# Assemble frontend + backend into one Vercel deployment (backend at /api).
# Usage: BACKEND_DIR=../polopine-backend scripts/deploy-with-backend.sh
set -euo pipefail
BACKEND_DIR="${BACKEND_DIR:-../polopine-backend}"
rm -rf server && mkdir -p server
cp -r "$BACKEND_DIR/src" "$BACKEND_DIR/package.json" server/
echo "server/ assembled; deploy this directory to the 'polopine' Vercel project with VITE_API_URL=/api"
