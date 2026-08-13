// 차 종류 (섹션 단위)
export const TEAS = [
  { id: 'memil', name: '메밀차' },
  { id: 'yeonip', name: '연잎차' },
]

// 각 차 아래의 분류. staff(직원)는 판매가 아닌 직원 소비분.
export const VARIANTS = [
  { id: 'ice', label: 'ICE' },
  { id: 'hot', label: 'HOT' },
  { id: 'staff', label: '직원' },
]

// 마감자 후보
export const CLOSERS = ['나청월', '김보훈', '황현욱']

// 항목 id는 `${tea}_${variant}` (예: memil_ice) — 기존 localStorage 데이터와 호환
export function itemId(teaId, variantId) {
  return `${teaId}_${variantId}`
}

export const ITEM_IDS = TEAS.flatMap((tea) =>
  VARIANTS.map((v) => itemId(tea.id, v.id)),
)

export function emptyDrinks() {
  const drinks = {}
  for (const id of ITEM_IDS) drinks[id] = 0
  return drinks
}

// 판매 잔 수 (직원 소비 제외)
export function soldTotal(drinks) {
  return TEAS.reduce(
    (sum, tea) =>
      sum +
      (drinks[itemId(tea.id, 'ice')] || 0) +
      (drinks[itemId(tea.id, 'hot')] || 0),
    0,
  )
}

// 직원 소비 잔 수
export function staffTotal(drinks) {
  return TEAS.reduce((sum, tea) => sum + (drinks[itemId(tea.id, 'staff')] || 0), 0)
}

// 기기 로컬 시간 기준 YYYY-MM-DD (toISOString은 UTC라 새벽에 날짜가 밀림)
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return toDateKey(new Date())
}
