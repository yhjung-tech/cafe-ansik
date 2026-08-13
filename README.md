# 카페 안식 — 음료 판매 기록

카페 음료 판매량을 기록하고 추이를 확인하는 모바일 웹앱 MVP입니다.
스마트폰 세로 화면에 최적화되어 있습니다.

## 화면

- **입력** (알바생용): 오늘 날짜의 음료 판매량을 입력합니다.
  - 음료 4종 고정: 메밀차 ICE / 메밀차 HOT / 연잎차 ICE / 연잎차 HOT
  - 음료별 +/− 스테퍼와 숫자 직접 입력, 저장 버튼
  - 오늘 이미 저장한 값이 있으면 불러와서 수정할 수 있습니다.
- **추이** (사장용): 최근 14일 판매 추이를 확인합니다.
  - 일자별 합계 막대 차트 (외부 라이브러리 없이 CSS로 구현)
  - 막대를 누르면 해당 날짜의 음료별 판매 내역이 보입니다.

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

- MVP 단계라 **localStorage**에 저장합니다. 데이터 구조:
  `{ "YYYY-MM-DD": { memil_ice: 3, memil_hot: 1, yeonip_ice: 2, yeonip_hot: 0 } }`
- ⚠️ **한계**: localStorage는 브라우저(기기)마다 따로 저장되므로 **기기 간 공유가 되지 않습니다.**
  알바생 폰에서 입력한 값은 사장님 폰에서 보이지 않습니다. 같은 기기(예: 매장 공용 태블릿)에서
  사용하거나, 백엔드 연동 후 사용하세요.
- 데이터 접근은 `src/storage.js` 한 파일에 모여 있습니다
  (`getDailySales` / `saveDailySales` / `getAllSales`). 나중에 Supabase 등
  백엔드로 교체할 때 이 파일만 바꾸면 됩니다.

## 구조

```
src/
  main.jsx       # 엔트리
  App.jsx        # 탭 전환 (입력 / 추이)
  EntryView.jsx  # 판매량 입력 화면
  TrendView.jsx  # 14일 추이 차트 + 일자별 내역
  drinks.js      # 음료 목록, 날짜 유틸
  storage.js     # 데이터 레이어 (localStorage)
  index.css      # 전체 스타일
```
