// 판매 기록 대상 음료 목록 (고정 4종)
export const DRINKS = [
  { id: 'memil_ice', name: '메밀차', temp: 'ICE' },
  { id: 'memil_hot', name: '메밀차', temp: 'HOT' },
  { id: 'yeonip_ice', name: '연잎차', temp: 'ICE' },
  { id: 'yeonip_hot', name: '연잎차', temp: 'HOT' },
]

export function emptySales() {
  const sales = {}
  for (const drink of DRINKS) sales[drink.id] = 0
  return sales
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
