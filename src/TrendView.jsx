import { useMemo, useState } from 'react'
import { DRINKS, toDateKey, todayKey } from './drinks.js'
import { getAllSales } from './storage.js'

const DAYS = 14

function lastNDays(n) {
  const days = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    days.push(d)
  }
  return days
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function TrendView() {
  const [selectedKey, setSelectedKey] = useState(todayKey)

  const days = useMemo(() => {
    const all = getAllSales()
    return lastNDays(DAYS).map((date) => {
      const key = toDateKey(date)
      const sales = all[key] ?? null
      const total = sales
        ? DRINKS.reduce((sum, d) => sum + (sales[d.id] || 0), 0)
        : 0
      return { key, date, sales, total }
    })
  }, [])

  const maxTotal = Math.max(1, ...days.map((d) => d.total))
  const selected = days.find((d) => d.key === selectedKey) ?? days[days.length - 1]
  const hasAnyData = days.some((d) => d.sales !== null)

  return (
    <div className="view">
      <p className="entry-hint">최근 {DAYS}일 판매 추이 · 막대를 누르면 상세가 보여요</p>

      {!hasAnyData && (
        <p className="empty-note">아직 저장된 판매 기록이 없습니다.</p>
      )}

      <div className="chart" role="img" aria-label={`최근 ${DAYS}일 일별 판매량 막대 차트`}>
        {days.map((day) => (
          <button
            type="button"
            key={day.key}
            className={`chart-col${day.key === selected.key ? ' selected' : ''}`}
            onClick={() => setSelectedKey(day.key)}
            aria-label={`${day.date.getMonth() + 1}월 ${day.date.getDate()}일 ${day.total}잔`}
          >
            <span className="chart-value">
              {day.key === selected.key && day.total > 0 ? day.total : ' '}
            </span>
            <span className="chart-bar-track">
              <span
                className="chart-bar"
                style={{ height: `${(day.total / maxTotal) * 100}%` }}
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
          <strong>{selected.total}잔</strong>
        </div>
        {selected.sales ? (
          <ul className="day-detail-list">
            {DRINKS.map((drink) => (
              <li key={drink.id}>
                <span className="drink-label">
                  <span className="drink-name">{drink.name}</span>
                  <span className={`drink-temp temp-${drink.temp.toLowerCase()}`}>
                    {drink.temp}
                  </span>
                </span>
                <span className="day-detail-count">{selected.sales[drink.id] || 0}잔</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">이 날짜에는 기록이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
