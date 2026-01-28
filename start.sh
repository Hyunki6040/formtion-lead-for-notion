#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# .env 파일 확인 및 로드
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "❌ .env 파일이 없습니다. 먼저 ./setup.sh를 실행하세요."
    exit 1
fi
source "$SCRIPT_DIR/.env"

# 기본값 설정
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

mkdir -p "$SCRIPT_DIR/logs"

echo "🚀 FORMTION 서버 시작..."

# 기존 프로세스 종료
"$SCRIPT_DIR/stop.sh" 2>/dev/null || true

# Backend 시작
cd "$SCRIPT_DIR/backend"
nohup uv run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/logs/backend.pid"

# Frontend 시작 (빌드된 정적 파일 서빙)
cd "$SCRIPT_DIR/frontend"
nohup npm run preview -- --port $FRONTEND_PORT --host > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
echo $! > "$SCRIPT_DIR/logs/frontend.pid"

sleep 2

echo ""
echo "✅ 서버 시작됨"
echo "  📡 API: http://localhost:$BACKEND_PORT"
echo "  🌐 Web: http://localhost:$FRONTEND_PORT"
echo ""
echo "로그: tail -f logs/backend.log"
echo "중지: ./stop.sh"
