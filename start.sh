#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SCRIPT_DIR/logs"

echo "🚀 FORMTION 서버 시작..."

# 기존 프로세스 종료
"$SCRIPT_DIR/stop.sh" 2>/dev/null || true

# Backend 시작
cd "$SCRIPT_DIR/backend"
nohup uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/logs/backend.pid"

# Frontend 시작 (빌드된 정적 파일 서빙)
cd "$SCRIPT_DIR/frontend"
nohup npm run preview -- --port 3000 --host > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/logs/frontend.pid"

sleep 2

echo ""
echo "✅ 서버 시작됨"
echo "  📡 API: http://localhost:8000"
echo "  🌐 Web: http://localhost:3000"
echo ""
echo "로그: tail -f logs/backend.log"
echo "중지: ./stop.sh"
