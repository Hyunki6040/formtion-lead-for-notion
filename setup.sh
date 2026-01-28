#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  FORMTION - 초기 설정"
echo "============================================"

# .env 파일 확인
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "❌ .env 파일이 없습니다."
    echo ""
    echo ".env 파일을 생성해주세요:"
    echo ""
    echo "  cp env.template .env"
    echo "  nano .env  # 값 수정"
    echo ""
    exit 1
fi

# .env 파일 로드
source "$SCRIPT_DIR/.env"

# 필수 값 확인
if [ -z "$JWT_SECRET" ]; then
    echo "❌ .env 파일에 JWT_SECRET을 설정해주세요."
    exit 1
fi

# 기본값 설정
API_URL=${API_URL:-"http://localhost:8000"}
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo ""
echo "📋 설정 확인:"
echo "  - JWT_SECRET: ****${JWT_SECRET: -4}"
echo "  - API_URL: $API_URL"
echo "  - BACKEND_PORT: $BACKEND_PORT"
echo "  - FRONTEND_PORT: $FRONTEND_PORT"
echo ""

# Backend .env 생성
echo "=== Backend 설정 ==="
cat > "$SCRIPT_DIR/backend/.env" << EOF
JWT_SECRET_KEY=$JWT_SECRET
DATABASE_URL=sqlite+aiosqlite:///./formtion.db
CORS_ORIGINS=["http://localhost:$FRONTEND_PORT","$API_URL"]
EOF
echo "✅ backend/.env 생성됨"

# Backend 의존성 설치
echo "📦 Backend 의존성 설치..."
cd "$SCRIPT_DIR/backend"
uv sync

# DB 마이그레이션
echo "🗄️ DB 마이그레이션..."
uv run python migrations.py

# Frontend 설정
echo ""
echo "=== Frontend 설정 ==="
cat > "$SCRIPT_DIR/frontend/.env.production" << EOF
VITE_API_URL=$API_URL
EOF
echo "✅ frontend/.env.production 생성됨"

# Frontend 의존성 설치 및 빌드
echo "📦 Frontend 의존성 설치..."
cd "$SCRIPT_DIR/frontend"
npm install

echo "🔨 Frontend 빌드..."
npm run build

echo ""
echo "============================================"
echo "  ✅ 설정 완료!"
echo "============================================"
echo ""
echo "실행 방법:"
echo "  ./start.sh      # 서버 시작"
echo "  ./stop.sh       # 서버 중지"
echo ""
