// 데이터 레이어 — 현재는 localStorage 구현.
// 나중에 Supabase 등 백엔드로 교체할 때 이 파일의 세 함수만
// (시그니처를 유지한 채 async 버전으로) 바꾸면 된다.

const STORAGE_KEY = 'cafe-ansik:sales'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * 특정 날짜의 판매량을 가져온다.
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {Record<string, number> | null} 음료 id → 잔 수, 기록 없으면 null
 */
export function getDailySales(dateKey) {
  const all = readAll()
  return all[dateKey] ?? null
}

/**
 * 특정 날짜의 판매량을 저장(덮어쓰기)한다.
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @param {Record<string, number>} sales - 음료 id → 잔 수
 */
export function saveDailySales(dateKey, sales) {
  const all = readAll()
  all[dateKey] = sales
  writeAll(all)
}

/**
 * 전체 판매 기록을 가져온다.
 * @returns {Record<string, Record<string, number>>} 날짜 → (음료 id → 잔 수)
 */
export function getAllSales() {
  return readAll()
}
