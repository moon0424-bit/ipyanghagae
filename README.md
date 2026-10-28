# 입양하개

유기동물 입양공고를 AI가 자세하게 정리해 주는 웹앱입니다. (수업 과제용 프로토타입)

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `public/index.html` | 앱 화면 전체 (HTML·CSS·JavaScript) |
| `public/photos/` | 실제 공고 사진 96장 (공공데이터 수집) |
| `api/ai.js` | AI 서버 함수. API 키를 숨기고 Claude API를 대신 호출 |
| `dev-server.mjs` | 내 컴퓨터에서 미리 보기용 서버 |
| `.env.example` | API 키 입력 예시 (실제 키 파일 `.env`는 GitHub에 올라가지 않음) |

## 내 컴퓨터에서 실행

1. Node.js 20 이상 설치
2. `.env.example`을 복사해 `.env`로 이름을 바꾸고 API 키 입력
3. 터미널에서 `npm run dev` → 브라우저에서 http://localhost:3000

## 비용 안전장치

- Claude Console에서 선불 크레딧만 충전하고 자동 충전(Auto-reload)은 끈다.
- `api/ai.js`: Haiku 모델, 답변 길이 상한, 1분당 요청 수 제한, 하루 요청 수 상한, 입양하개 프롬프트만 허용.
- 같은 요청은 브라우저에 저장해 다시 AI를 부르지 않는다.

## 배포

GitHub 저장소에 올린 뒤 Vercel에서 가져오기(Import)하고,
환경변수 `ANTHROPIC_API_KEY`에 API 키를 넣는다.
