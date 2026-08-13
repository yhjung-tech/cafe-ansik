import { useEffect, useMemo, useState } from 'react'
import {
  TEAS,
  VARIANTS,
  itemId,
  soldTotal,
  staffTotal,
  toDateKey,
  todayKey,
} from './drinks.js'
import { getAllSales } from './storage.js'

const DAYS = 14

function lastNDays(n) {
  const days = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))
  }
  return days
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function TrendView() {
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [all, setAll] = useState(null) // null = 로딩 중
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAllSales()
      .then((data) => {
        if (!cancelled) setAll(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setAll({})
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const days = useMemo(() => {
    if (!all) return []
    return lastNDays(DAYS).map((date) => {
      const key = toDateKey(date)
      const record = all[key] ?? null
      return {
        key,
        date,
        record,
        sold: record ? soldTotal(record.drinks) : 0,
        staff: record ? staffTotal(record.drinks) : 0,
      }
    })
  }, [all])

  if (!all) {
    return (
      <div className="view">
        <p className="empty-note">판매 기록을 불러오는 중…</p>
      </div>
    )
  }

  const maxSold = Math.max(1, ...days.map((d) => d.sold))
  const selected = days.find((d) => d.key === selectedKey) ?? days[days.length - 1]
  const hasAnyData = days.some((d) => d.record !== null)

  return (
    <div className="view">
      <p className="entry-hint">
        최근 {DAYS}일 판매 추이 (직원 소비 제외) · 막대를 누르면 상세가 보여요
      </p>

      {error && <p className="error-note">{error}</p>}
      {!error && !hasAnyData && (
        <p className="empty-note">아직 저장된 판매 기록이 없습니다.</p>
      )}

      <div className="chart" role="img" aria-label={`최근 ${DAYS}일 일별 판매량 막대 차트`}>
        {days.map((day) => (
          <button
            type="button"
            key={day.key}
            className={`chart-col${day.key === selected.key ? ' selected' : ''}`}
            onClick={() => setSelectedKey(day.key)}
            aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일 ${day.sold}잔`}
          >
            <span className="chart-value">
              {day.key === selected.key && day.sold > 0 ? day.sold : ' '}
            </span>
            <span className="chart-bar-track">
              <span
                className="chart-bar"
                style={{ height: `${(day.sold / maxSold) * 100}%` }}
              />
            </span>
            <span className="chart-day">{day.date.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="day-detail">
        <div className="day-detail-head">
          <span>
            {selected.date.getMonth() + 1}월 {selected.date.getDate()}일 (
            {WEEKDAYS[selected.date.getDay()]})
          </span>
          <strong>{selected.sold}잔</strong>
        </div>
        {selected.record ? (
          <>
            {TEAS.map((tea) => (
              <div key={tea.id} className="day-detail-group">
                <p className="day-detail-tea">{tea.name}</p>
                <ul className="day-detail-list">
                  {VARIANTS.map((variant) => (
                    <li key={variant.id}>
                      <span className={`drink-temp temp-${variant.id}`}>
                        {variant.label}
                      </span>
                      <span className="day-detail-count">
                        {selected.record.drinks[itemId(tea.id, variant.id)] || 0}잔
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {selected.record.note && (
              <p className="day-detail-note">📝 {selected.record.note}</p>
            )}
            <div className="day-detail-foot">
              <span>직원 소비 {selected.staff}잔</span>
              <span>마감자 {selected.record.closer ?? '미지정'}</span>
            </div>
          </>
        ) : (
          <p className="empty-note">이 날짜에는 기록이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
