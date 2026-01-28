<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="MIT License" />
</p>

<h1 align="center">🔐 FORMTION</h1>

<p align="center">
  <strong>Notion 페이지를 리드 수집 도구로 바꾸는 가장 빠른 방법</strong>
</p>

<p align="center">
  콘텐츠는 이미 있습니다. 이제 리드만 수집하세요.
</p>

<p align="center">
  <a href="https://github.com/Hyunki6040/fromtion-lead-notion">GitHub</a> •
  <a href="#-빠른-시작">빠른 시작</a> •
  <a href="#-ec2-배포-가이드">EC2 배포</a> •
  <a href="#-사용-가이드">사용 가이드</a>
</p>

---

## 🎯 왜 FORMTION인가?

> **"좋은 콘텐츠 만들었는데, 그냥 공개하기 아깝지 않으세요?"**

블로그, 가이드, 템플릿, 리서치 자료... Notion으로 열심히 만든 콘텐츠.
그냥 공개하면 트래픽은 오지만, **누가 봤는지 알 수 없습니다.**

FORMTION은 Notion 페이지에 **"게이트"**를 추가합니다.

```
📄 Notion 페이지 → 🔒 블러 처리 → 📧 이메일 입력 → ✨ 콘텐츠 공개
```

**5분 만에** 리드 수집 페이지 완성. 코딩 필요 없음.

---

## ✨ 주요 기능

### 🔒 스마트 블라인드
콘텐츠 일부만 보여주고 나머지는 블러 처리. 독자의 궁금증을 자극합니다.

- **Preview-then-Blur**: 상단 일부 공개 후 나머지 블러
- **Section Blur**: 특정 섹션만 블러
- **Keyword Blackout**: 핵심 키워드만 가리기

### 📧 유연한 리드 폼
브랜드에 맞는 폼 스타일을 선택하세요.

| 패턴 | 설명 | 추천 상황 |
|------|------|----------|
| **Floating CTA** | 하단 고정 버튼 | 긴 콘텐츠, 스크롤 유도 |
| **Entry Modal** | 진입 시 모달 | 고가치 콘텐츠 |
| **Top/Bottom Form** | 페이지 내 폼 | 자연스러운 흐름 |

### 🔔 실시간 알림
리드가 들어오면 바로 알림을 받으세요.

- **Slack** 웹훅 연동
- **Discord** 웹훅 연동
- **Custom Webhook** 지원

### 📊 대시보드
수집된 리드를 한눈에 관리합니다.

- 프로젝트별 리드 현황
- CSV 내보내기
- 상세 정보 확인

---

## 🚀 빠른 시작

### 요구사항

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python 패키지 매니저)

### 설치

```bash
# 클론
git clone https://github.com/Hyunki6040/fromtion-lead-notion.git
cd fromtion-lead-notion

# 백엔드 설정
cd backend
cp env.template .env
uv sync

# 프론트엔드 설정
cd ../frontend
npm install
```

### 실행

```bash
# 개발 모드 (핫 리로드)
./start-dev.sh

# 또는 프로덕션 모드
./start.sh
```

### 접속

| 서비스 | URL |
|--------|-----|
| 🌐 웹 앱 | http://localhost:3000 |
| 📡 API | http://localhost:8000 |
| 📚 API 문서 | http://localhost:8000/docs |

---

## 📖 사용 가이드

### 1️⃣ 프로젝트 생성

1. **회원가입/로그인** 후 대시보드 접속
2. **"새 프로젝트"** 클릭
3. **Notion 공개 링크** 입력
   > ⚠️ Notion 페이지가 "웹에 게시" 상태여야 합니다

### 2️⃣ 게이트 설정

```
┌─────────────────────────────────────┐
│  📝 UX 패턴 선택                    │
│  ├── Floating CTA (추천)           │
│  ├── Entry Modal                    │
│  └── Top/Bottom Form               │
├─────────────────────────────────────┤
│  🔒 블라인드 설정                   │
│  ├── 블러 위치: 30% (상단 공개)     │
│  └── 블러 강도: Medium              │
├─────────────────────────────────────┤
│  📧 수집 필드                       │
│  ├── ✅ 이메일 (필수)               │
│  ├── ☐ 이름                        │
│  ├── ☐ 회사명                      │
│  └── ☐ 직무                        │
└─────────────────────────────────────┘
```

### 3️⃣ 공유 및 배포

프로젝트 저장 후 생성된 **공유 링크**를 배포하세요:

```
https://your-domain.com/v/my-awesome-guide
```

SNS, 뉴스레터, 광고 등 어디든 활용 가능합니다.

### 4️⃣ 리드 확인

대시보드에서 실시간으로 리드를 확인하고 CSV로 내보내세요.

---

## 🔔 웹훅 설정

### Slack

1. Slack에서 [Incoming Webhook](https://api.slack.com/messaging/webhooks) 생성
2. 프로젝트 설정에서 Webhook URL 입력
3. 리드 수집 시 자동 알림

```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "company": "스타트업",
  "project": "마케팅 가이드"
}
```

### Discord

1. Discord 채널 설정 → 연동 → 웹후크 생성
2. 프로젝트 설정에서 Discord Webhook URL 입력

---

## 🏗️ 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                          │
│   React 18 + TypeScript + Tailwind CSS + Vite           │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────┐
│                        Backend                           │
│   FastAPI + SQLAlchemy + JWT Auth                       │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                       Database                           │
│   SQLite (개발) / PostgreSQL (프로덕션 권장)             │
└──────────────────────────────────────────────────────────┘
```

### 프로젝트 구조

```
fromtion-lead-notion/
├── backend/
│   ├── app/
│   │   ├── api/          # API 엔드포인트
│   │   ├── core/         # 설정, 보안, DB
│   │   ├── models/       # 데이터 모델
│   │   ├── schemas/      # 요청/응답 스키마
│   │   └── services/     # 비즈니스 로직
│   └── migrations.py     # DB 마이그레이션
│
├── frontend/
│   └── src/
│       ├── components/   # UI 컴포넌트
│       ├── pages/        # 페이지
│       ├── contexts/     # 상태 관리
│       └── lib/          # 유틸리티
│
├── deploy.sh             # 배포 스크립트
└── docs/prd/             # 기획 문서
```

---

## 🚢 EC2 배포 가이드

### 1단계: 서버 준비 (Ubuntu 22.04)

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 필수 패키지 설치
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip sqlite3

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# uv 설치 (Python 패키지 매니저)
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

### 2단계: 프로젝트 클론 및 설정

```bash
cd ~
git clone https://github.com/Hyunki6040/fromtion-lead-notion.git
cd fromtion-lead-notion

# 백엔드 설정
cd backend
cp env.template .env
nano .env  # JWT_SECRET_KEY 변경 필수!
```

**.env 설정:**
```env
JWT_SECRET_KEY=your-super-secret-key-change-this
DATABASE_URL=sqlite+aiosqlite:///./formtion.db
CORS_ORIGINS=["https://your-domain.com"]
```

```bash
# 의존성 설치 및 마이그레이션
uv sync
uv run python migrations.py

# 프론트엔드 빌드
cd ../frontend
npm install
echo "VITE_API_URL=https://your-domain.com" > .env.production
npm run build
```

### 3단계: Systemd 서비스 등록

```bash
sudo nano /etc/systemd/system/formtion-api.service
```

```ini
[Unit]
Description=FORMTION API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/fromtion-lead-notion/backend
Environment="PATH=/home/ubuntu/.local/bin:/usr/bin"
ExecStart=/home/ubuntu/.local/bin/uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable formtion-api
sudo systemctl start formtion-api

# 상태 확인
sudo systemctl status formtion-api
```

### 4단계: deploy.sh 설정

```bash
cd ~/fromtion-lead-notion
chmod +x deploy.sh
```

**deploy.sh 내용:**
```bash
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
```

### 5단계: 업데이트 배포

코드 변경 후 배포:

```bash
cd ~/fromtion-lead-notion
./deploy.sh
```

### 6단계: Nginx 연동 (선택)

별도 Nginx 서버가 있는 경우, 프록시 설정:

```nginx
# API 프록시
location /api {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# 프론트엔드 정적 파일
location / {
    root /home/ubuntu/fromtion-lead-notion/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## 🔧 환경 변수

### Backend (`backend/.env`)

```env
# 필수 - 반드시 변경!
JWT_SECRET_KEY=your-super-secret-key-change-this

# 데이터베이스
DATABASE_URL=sqlite+aiosqlite:///./formtion.db

# CORS (프론트엔드 도메인)
CORS_ORIGINS=["http://localhost:3000","https://your-domain.com"]
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_URL=https://your-domain.com
```

---

## 📦 DB 마이그레이션

스키마 변경 시 마이그레이션 스크립트 사용:

```bash
cd backend
uv run python migrations.py
```

**출력 예시:**
```
[DB] /path/to/formtion.db
[TIME] 2024-01-15T10:30:00
--------------------------------------------------
[RUN] 001_add_bookmarks_name_column - 북마크에 사용자 지정 이름 컬럼 추가
[OK] 001_add_bookmarks_name_column - 완료
--------------------------------------------------
[DONE] 적용: 1, 스킵: 0
```

**새 마이그레이션 추가:**

`backend/migrations.py`의 `MIGRATIONS` 배열에 추가:

```python
{
    "name": "002_add_new_column",
    "description": "새 컬럼 추가",
    "sql": "ALTER TABLE table_name ADD COLUMN column_name VARCHAR(100)",
    "check": lambda conn: column_exists(conn, "table_name", "column_name"),
},
```

---

## 🤝 기여하기

이슈와 PR을 환영합니다!

1. Fork
2. Feature branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Pull Request

---

## 📄 라이선스

MIT License - 자유롭게 사용하세요.

---

<p align="center">
  <strong>콘텐츠의 가치를 리드로 바꾸세요.</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/Hyunki6040/fromtion-lead-notion">FORMTION Team</a>
</p>
