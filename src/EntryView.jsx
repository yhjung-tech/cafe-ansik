import { useState } from 'react'
import { DRINKS, emptySales, todayKey } from './drinks.js'
import { getDailySales, saveDailySales } from './storage.js'

function formatToday() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function clampCount(value) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(999, Math.floor(value)))
}

export default function EntryView() {
  const [dateKey] = useState(todayKey)
  const [sales, setSales] = useState(() => ({
    ...emptySales(),
    ...(getDailySales(todayKey()) ?? {}),
  }))
  const [savedAt, setSavedAt] = useState(null)

  const update = (id, value) => {
    setSales((prev) => ({ ...prev, [id]: clampCount(value) }))
    setSavedAt(null)
  }

  const handleSave = () => {
    saveDailySales(dateKey, sales)
    setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }))
  }

  const total = DRINKS.reduce((sum, d) => sum + (sales[d.id] || 0), 0)

  return (
    <div className="view">
      <p className="entry-date">{formatToday()}</p>
      <p className="entry-hint">오늘 판매한 잔 수를 입력해 주세요</p>

      <ul className="drink-list">
        {DRINKS.map((drink) => (
          <li key={drink.id} className="drink-row">
            <div className="drink-label">
              <span className="drink-name">{drink.name}</span>
              <span className={`drink-temp temp-${drink.temp.toLowerCase()}`}>{drink.temp}</span>
            </div>
            <div className="stepper">
              <button
                type="button"
                className="stepper-btn"
                aria-label={`${drink.name} ${drink.temp} 1잔 빼기`}
                onClick={() => update(drink.id, (sales[drink.id] || 0) - 1)}
              >
                −
              </button>
              <input
                className="stepper-input"
                type="number"
                inputMode="numeric"
                min="0"
                max="999"
                value={sales[drink.id] ?? 0}
                aria-label={`${drink.name} ${drink.temp} 잔 수`}
                onFocus={(e) => e.target.select()}
                onChange={(e) => update(drink.id, e.target.valueAsNumber)}
              />
              <button
                type="button"
                className="stepper-btn"
                aria-label={`${drink.name} ${drink.temp} 1잔 더하기`}
                onClick={() => update(drink.id, (sales[drink.id] || 0) + 1)}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="entry-total">
        <span>오늘 합계</span>
        <strong>{total}잔</strong>
      </div>

      <button type="button" className="save-btn" onClick={handleSave}>
        저장하기
      </button>
      {savedAt && <p className="save-note">{savedAt}에 저장되었습니다</p>}
    </div>
  )
}
