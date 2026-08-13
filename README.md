# 카페 안식 — 음료 판매 기록

카페 음료 판매량을 기록하고 추이를 확인하는 모바일 웹앱 MVP입니다.
스마트폰 세로 화면에 최적화되어 있습니다.

## 화면

- **입력** (알바생용): 오늘 날짜의 음료 판매량을 입력합니다.
  - 메밀차 / 연잎차 두 섹션, 각 섹션에 ICE · HOT · 직원(직원 소비분) 3개 항목
  - 항목별 +/− 스테퍼와 숫자 직접 입력
  - 마감자 선택(나청월 / 김보훈 / 황현욱) 후 저장 — 마감자를 고르지 않으면 저장되지 않습니다.
  - 오늘 이미 저장한 값이 있으면 불러와서 수정할 수 있습니다.
- **추이** (사장용): 최근 14일 판매 추이를 확인합니다.
  - 일자별 판매 합계(직원 소비 제외) 막대 차트 (외부 차트 라이브러리 없이 CSS로 구현)
  - 막대를 누르면 해당 날짜의 차별 ICE/HOT/직원 내역과 마감자가 보입니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
npm run lint     # oxlint
```

스마트폰에서 확인하려면 `npm run dev -- --host`로 실행한 뒤
같은 Wi-Fi에서 표시된 주소로 접속하세요.

## 데이터 저장

- **Supabase**(PostgreSQL)에 저장되어 기기 간에 데이터가 공유됩니다.
  - 테이블: `cafe_ansik_daily_sales` — `sale_date date PK, closer text, drinks jsonb, updated_at`
  - `drinks` 구조: `{ memil_ice: 3, memil_hot: 1, memil_staff: 0, yeonip_ice: 2, yeonip_hot: 0, yeonip_staff: 1 }`
- 데이터 접근은 `src/storage.js` 한 파일에 모여 있습니다
  (`getDailySales` / `saveDailySales` / `getAllSales`). 백엔드를 바꾸려면 이 파일만 교체하면 됩니다.
- ⚠️ **보안 한계 (MVP)**: 앱에 로그인이 없고 공개 publishable 키로 접근하며,
  RLS 정책이 익명 읽기/쓰기를 허용합니다. URL을 아는 사람은 누구나 기록을 읽고
  수정할 수 있으니, 외부에 링크를 공유하지 마세요. 나중에 Supabase Auth로 잠글 수 있습니다.

## 구조

```
src/
  main.jsx       # 엔트리
  App.jsx        # 탭 전환 (입력 / 추이)
  EntryView.jsx  # 판매량 입력 화면
  TrendView.jsx  # 14일 추이 차트 + 일자별 내역
  drinks.js      # 차/분류/마감자 목록, 날짜 유틸
  storage.js     # 데이터 레이어 (Supabase)
  index.css      # 전체 스타일
```
