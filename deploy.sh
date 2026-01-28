#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 FORMTION 배포 시작..."

echo "📥 코드 업데이트..."
git pull origin main

echo "📦 Backend 의존성..."
cd backend && uv sync

echo "🗄️ DB 마이그레이션..."
uv run python migrations.py

echo "📦 Frontend 빌드..."
cd ../frontend && npm install && npm run build

echo "🔄 서버 재시작..."
cd ..
./stop.sh 2>/dev/null || true
./start.sh

echo ""
echo "✅ 배포 완료!"
