#!/bin/bash
set -e

cd ~/fromtion-lead-notion

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Backend: Installing dependencies ==="
cd backend
uv sync

echo "=== Running DB migrations ==="
uv run python migrations.py

echo "=== Restarting backend ==="
sudo systemctl restart formtion-api

echo "=== Frontend: Building ==="
cd ../frontend
npm install
npm run build

echo "=== Deploy complete! ==="
