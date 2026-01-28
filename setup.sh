#!/bin/bash
set -e

echo "============================================"
echo "  FORMTION - 초기 설정"
echo "============================================"

# 환경 변수 확인
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET 환경변수를 설정해주세요."
    echo ""
    echo "예시:"
    echo "  export JWT_SECRET=your-secret-key-here"
    echo "  export API_URL=https://your-domain.com"
    echo "  ./setup.sh"
    exit 1
fi

API_URL=${API_URL:-"http://localhost:8000"}
CORS_ORIGINS=${CORS_ORIGINS:-"[\"http://localhost:3000\",\"$API_URL\"]"}

echo ""
echo "📋 설정 확인:"
echo "  - JWT_SECRET: ****${JWT_SECRET: -4}"
echo "  - API_URL: $API_URL"
echo ""

# Backend .env 생성
echo "=== Backend 설정 ==="
cd backend
cat > .env << EOF
JWT_SECRET_KEY=$JWT_SECRET
DATABASE_URL=sqlite+aiosqlite:///./formtion.db
CORS_ORIGINS=$CORS_ORIGINS
EOF
echo "✅ backend/.env 생성됨"

# Backend 의존성 설치
echo "📦 Backend 의존성 설치..."
uv sync

# DB 마이그레이션
echo "🗄️ DB 마이그레이션..."
uv run python migrations.py

# Frontend 설정
echo ""
echo "=== Frontend 설정 ==="
cd ../frontend

cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF
echo "✅ frontend/.env.production 생성됨"

# Frontend 의존성 설치 및 빌드
echo "📦 Frontend 의존성 설치..."
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
