# 교실 알리미 웹 버전 Design Spec

## Goal
Flutter 앱(교실 알리미)과 동일한 기능(학교 검색, 주간 시간표, 학사일정 캘린더)을 Next.js 웹사이트로 구현하여 Vercel에 배포한다. 알림 기능 없음. NEIS API 연동 검증 포함.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: localStorage (학교/학년/반 설정 저장, 이번 버전에서 Supabase 미사용)
- **Deployment**: Vercel
- **API**: NEIS 교육정보 개방 포털 (open.neis.go.kr)

## UI/UX 방향
iOS 캘린더 + 에브리타임 스타일
- 배경: `#f2f2f7` (iOS 시스템 그레이)
- 카드: 흰색 + `border-radius: 10px` + 가벼운 그림자
- 강조색: `#007AFF` (iOS 블루)
- 보조색: `#34c759` (그린), `#ff9500` (오렌지), `#ff3b30` (레드)
- 폰트: 시스템 폰트 (`-apple-system, BlinkMacSystemFont`)
- 하단 탭바: 시간표 | 캘린더 | 설정

---

## Architecture

### Pages (App Router)

| 경로 | 역할 |
|------|------|
| `/` | 온보딩 — 학교 검색 → 학년/반 선택 → `/timetable`로 이동 |
| `/timetable` | 주간 시간표 — 요일 탭(월~금) + 교시 카드 목록 |
| `/calendar` | 월별 캘린더 + 학사일정 리스트 |
| `/settings` | 학교/학년/반 변경 |

### API Routes (NEIS CORS 프록시)

| 엔드포인트 | NEIS API | 설명 |
|-----------|---------|------|
| `GET /api/neis/school?q=검색어` | `/schoolInfo` | 학교 검색 |
| `GET /api/neis/timetable?region=&code=&grade=&class=&from=&to=&level=` | `/hisTimetable`(고) `/misTimetable`(중) `/elsTimetable`(초) | 주간 시간표 (school.level에 따라 엔드포인트 분기) |
| `GET /api/neis/schedule?region=&code=&from=&to=` | `/SchoolSchedule` | 학사일정 |

> Next.js API Routes가 서버에서 NEIS API를 호출하여 CORS 문제를 우회한다.

### 데이터 흐름

```
브라우저
  └─ fetch /api/neis/school?q=...
        └─ Next.js API Route
              └─ fetch open.neis.go.kr/hub/schoolInfo (서버→NEIS)
              └─ JSON 응답 반환
  └─ localStorage에 {region, code, schoolName, grade, class} 저장
  └─ fetch /api/neis/timetable?...
        └─ Next.js API Route → NEIS 시간표 → 파싱 → 반환
```

### 로컬 스토리지 스키마

```json
{
  "school": {
    "name": "경기북과학고등학교",
    "code": "7430310",
    "region": "J10",
    "level": "high"
  },
  "grade": 2,
  "classNum": 2
}
```

---

## 화면별 상세

### 1. 온보딩 (`/`)
- 학교명 검색 input → 디바운스 300ms → `/api/neis/school` 호출
- 결과 리스트 → 학교 선택
- 학년(1~3) / 반(숫자 직접 입력, free text number input)
- "시작하기" → localStorage 저장 → `/timetable` 이동

### 2. 주간 시간표 (`/timetable`)
- 상단: 학교명 + 학년/반 표시
- 요일 탭 (월~금), 오늘 자동 선택
- 교시 카드: 교시번호 원형 배지 + 과목명 + 시간
  - 진행 중 교시: 파란 테두리 강조
  - 지난 교시: 흐릿하게 표시
- 학사일정이 있는 날: 탭 아래 점(dot) 표시

### 3. 캘린더 (`/calendar`)
- 월별 캘린더 (iOS 캘린더 스타일)
- 이전/다음 월 네비게이션
- 학사일정 있는 날짜: 점 표시
- 날짜 탭하면 해당 일 일정 리스트 표시
- 하단: 해당 월 전체 일정 리스트

### 4. 설정 (`/settings`)
- 현재 학교/학년/반 표시
- "학교 변경" → 온보딩으로 이동
- NEIS API 응답 원본 JSON 뷰어 (개발/검증용 토글 패널)

---

## 파일 구조

```
homework-web/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 + 하단 탭바
│   ├── page.tsx                # 온보딩
│   ├── timetable/
│   │   └── page.tsx            # 주간 시간표
│   ├── calendar/
│   │   └── page.tsx            # 캘린더
│   ├── settings/
│   │   └── page.tsx            # 설정
│   └── api/
│       └── neis/
│           ├── school/route.ts       # 학교 검색 프록시
│           ├── timetable/route.ts    # 시간표 프록시
│           └── schedule/route.ts     # 학사일정 프록시
├── components/
│   ├── BottomNav.tsx           # 하단 탭바
│   ├── PeriodCard.tsx          # 교시 카드
│   ├── WeekdayTabs.tsx         # 요일 탭
│   ├── MonthCalendar.tsx       # 월별 캘린더
│   └── JsonViewer.tsx          # NEIS JSON 뷰어 (설정 페이지용)
├── lib/
│   ├── neis.ts                 # NEIS API 타입 + 파싱 유틸
│   └── storage.ts              # localStorage 헬퍼
└── .env.local                  # NEIS_API_KEY
```

---

## 환경 변수

```
NEIS_API_KEY=<나이스 API 키>
```

서버 사이드 API Route에서만 사용 (클라이언트에 노출 안 됨).

---

## 범위 외 (이번 버전 제외)

- 웹 푸시 알림
- 사용자 인증 / Supabase Auth
- 다중 사용자 데이터 저장 (localStorage로 충분)
