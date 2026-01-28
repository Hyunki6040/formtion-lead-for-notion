#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🛑 FORMTION 종료 중..."

# PID 파일로 종료
for service in backend frontend; do
    if [ -f "$SCRIPT_DIR/logs/${service}.pid" ]; then
        PID=$(cat "$SCRIPT_DIR/logs/${service}.pid")
        kill $PID 2>/dev/null && echo "✓ $service 종료됨"
        rm -f "$SCRIPT_DIR/logs/${service}.pid"
    fi
done

# 포트로 프로세스 종료 (백업)
for port in 8000 3000; do
    PID=$(lsof -ti :$port 2>/dev/null || true)
    [ ! -z "$PID" ] && kill $PID 2>/dev/null
done

echo "👋 종료 완료"
