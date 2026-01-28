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
  <strong>한국어</strong> •
  <a href="./docs/i18n/README.en.md">English</a> •
  <a href="./docs/i18n/README.ja.md">日本語</a> •
  <a href="./docs/i18n/README.zh.md">中文</a> •
  <a href="./docs/i18n/README.es.md">Español</a>
</p>

---

## 🎯 왜 FORMTION인가?

> **"좋은 콘텐츠 만들었는데, 그냥 공개하기 아깝지 않으세요?"**

FORMTION은 Notion 페이지에 **"게이트"**를 추가합니다.

```
📄 Notion 페이지 → 🔒 블러 처리 → 📧 이메일 입력 → ✨ 콘텐츠 공개
```

**5분 만에** 리드 수집 페이지 완성. 코딩 필요 없음.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔒 **스마트 블라인드** | 콘텐츠 일부만 공개, 나머지 블러 처리 |
| 📧 **유연한 폼** | Floating CTA, Entry Modal, Top/Bottom Form |
| 🔔 **실시간 알림** | Slack, Discord, Custom Webhook |
| 📊 **대시보드** | 리드 관리 및 CSV 내보내기 |

---

## 🚀 빠른 시작

```bash
git clone https://github.com/Hyunki6040/formtion-lead-for-notion.git
cd formtion-lead-for-notion

# 1. 환경 변수 설정
cp env.template .env
nano .env  # JWT_SECRET, API_URL 수정

# 2. 초기 설정 (최초 1회)
./setup.sh

# 3. 서버 시작
./start.sh
```

**.env 예시:**
```env
JWT_SECRET=your-secret-key-change-this
API_URL=https://your-domain.com
```

### 3. 접속

| 서비스 | URL |
|--------|-----|
| 🌐 Web | http://localhost:3000 |
| 📡 API | http://localhost:8000 |
| 📚 Docs | http://localhost:8000/docs |

---

## 🚢 EC2 배포

### 최초 설치

```bash
# 1. 필수 패키지 (Ubuntu 22.04)
sudo apt update && sudo apt install -y python3.11 python3.11-venv nodejs npm sqlite3
curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.bashrc

# 2. 프로젝트 클론
git clone https://github.com/Hyunki6040/formtion-lead-for-notion.git
cd formtion-lead-for-notion

# 3. 환경 변수 설정
cp env.template .env
nano .env  # JWT_SECRET, API_URL 수정

# 4. 설치 및 실행
./setup.sh
./start.sh
```

### 업데이트 배포

```bash
./deploy.sh
```

---

## 📖 사용 가이드

1. **회원가입/로그인** → 대시보드 접속
2. **새 프로젝트** → Notion 공개 링크 입력
3. **게이트 설정** → UX 패턴, 블러 강도, 수집 필드
4. **공유 링크 배포** → `https://your-domain.com/v/slug`
5. **리드 확인** → 대시보드에서 CSV 내보내기

> ⚠️ Notion 페이지는 "웹에 게시" 상태여야 합니다

---

## 🔔 Webhook 설정

프로젝트 설정에서 Webhook URL 입력:

- **Slack**: [Incoming Webhook](https://api.slack.com/messaging/webhooks) 생성
- **Discord**: 채널 설정 → 연동 → 웹후크

---

## 📂 프로젝트 구조

```
formtion-lead-for-notion/
├── backend/          # FastAPI + SQLAlchemy
├── frontend/         # React + TypeScript + Vite
├── setup.sh          # 초기 설정
├── start.sh          # 서버 시작
├── stop.sh           # 서버 중지
└── deploy.sh         # 배포 업데이트
```

---

## 🔧 스크립트

| 스크립트 | 설명 |
|----------|------|
| `./setup.sh` | 초기 설정 (env 생성, 의존성 설치, 빌드) |
| `./start.sh` | 서버 시작 (nohup 백그라운드) |
| `./stop.sh` | 서버 중지 |
| `./deploy.sh` | git pull + 마이그레이션 + 빌드 + 재시작 |

---

## 📄 라이선스

MIT License

---

<p align="center">
  <strong>콘텐츠의 가치를 리드로 바꾸세요.</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/Hyunki6040/formtion-lead-for-notion">FORMTION Team</a>
</p>
