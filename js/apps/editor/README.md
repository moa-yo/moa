# Moa Editor

실시간 협업 문서 편집기의 프론트엔드 애플리케이션입니다.

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd js/apps/editor
pnpm install
```

### 2. 개발 서버 실행

```bash
pnpm dev
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 🔧 기능

- **문서 관리**: 문서 생성, 조회, 편집
- **실시간 협업**: WebSocket을 통한 실시간 통신
- **JSON 편집기**: 문서 내용을 JSON 형태로 편집
- **연결 상태 모니터링**: WebSocket 연결 상태 표시
- **메시지 로그**: WebSocket 메시지 실시간 로그

## 📡 API 엔드포인트

- `GET /api/documents` - 문서 목록 조회
- `POST /api/documents` - 새 문서 생성
- `GET /api/documents/{id}` - 특정 문서 조회
- `PUT /api/documents/{id}` - 문서 업데이트
- `GET /api/health` - 서버 상태 확인

## 🔌 WebSocket

- `ws://localhost:8080/ws` - 실시간 통신

## 🛠️ 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **CSS Grid/Flexbox** - 반응형 레이아웃

## 📁 프로젝트 구조

```
src/
├── main.tsx          # 애플리케이션 진입점
├── App.tsx           # 메인 컴포넌트
├── App.css           # 스타일
└── index.css         # 글로벌 스타일
```

## 🎨 UI 특징

- **모던 디자인**: 그라데이션 배경과 글래스모피즘 효과
- **반응형 레이아웃**: 데스크톱, 태블릿, 모바일 지원
- **실시간 피드백**: 연결 상태 및 메시지 로그 표시
- **직관적인 인터페이스**: 문서 목록, 편집기, 로그 패널

## 🔄 백엔드 연동

이 앱은 Rust 백엔드 서버와 연동됩니다:

- API 요청은 프록시를 통해 `http://localhost:8080`으로 전달
- WebSocket 연결은 `ws://localhost:8080/ws`로 연결
