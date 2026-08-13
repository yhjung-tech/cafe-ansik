// 데이터 레이어 — Supabase 구현.
// 앱의 다른 코드는 이 파일의 세 함수만 사용하므로,
// 백엔드를 바꾸려면 이 파일만 교체하면 된다.
import { createClient } from '@supabase/supabase-js'

// publishable(anon) 키는 클라이언트에 노출되는 공개 키다.
// 접근 제어는 Supabase RLS 정책이 담당한다.
const SUPABASE_URL = 'https://jbkynctxkduolyqyodge.supabase.co'
const SUPABASE_KEY = 'sb_publishable_LT6bpybmFf2pLfCtQTA2rA_pl1b32Eg'

const TABLE = 'cafe_ansik_daily_sales'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function toRecord(row) {
  return { drinks: row.drinks ?? {}, closer: row.closer ?? null }
}

/**
 * 특정 날짜의 기록을 가져온다.
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {Promise<{drinks: Record<string, number>, closer: string|null} | null>}
 */
export async function getDailySales(dateKey) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('drinks, closer')
    .eq('sale_date', dateKey)
    .maybeSingle()
  if (error) throw new Error(`불러오기 실패: ${error.message}`)
  return data ? toRecord(data) : null
}

/**
 * 특정 날짜의 기록을 저장(덮어쓰기)한다.
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @param {{drinks: Record<string, number>, closer: string|null}} record
 */
export async function saveDailySales(dateKey, record) {
  const { error } = await supabase.from(TABLE).upsert({
    sale_date: dateKey,
    drinks: record.drinks,
    closer: record.closer,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`저장 실패: ${error.message}`)
}

/**
 * 전체 기록을 가져온다.
 * @returns {Promise<Record<string, {drinks: Record<string, number>, closer: string|null}>>}
 */
export async function getAllSales() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('sale_date, drinks, closer')
  if (error) throw new Error(`불러오기 실패: ${error.message}`)
  const all = {}
  for (const row of data ?? []) all[row.sale_date] = toRecord(row)
  return all
}
