import { useEffect, useState } from 'react'
import {
  TEAS,
  VARIANTS,
  CLOSERS,
  itemId,
  emptyDrinks,
  soldTotal,
  staffTotal,
  todayKey,
} from './drinks.js'
import { getDailySales, saveDailySales } from './storage.js'

function formatDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
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
  const [dateKey, setDateKey] = useState(todayKey)
  const [drinks, setDrinks] = useState(emptyDrinks)
  const [closer, setCloser] = useState(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('loading') // loading | ready | saving
  const [message, setMessage] = useState(null) // {type: 'ok'|'error', text}

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setMessage(null)
    getDailySales(dateKey)
      .then((record) => {
        if (cancelled) return
        setDrinks({ ...emptyDrinks(), ...(record?.drinks ?? {}) })
        setCloser(record?.closer ?? null)
        setNote(record?.note ?? '')
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('ready')
        setMessage({ type: 'error', text: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [dateKey])

  const update = (id, value) => {
    setDrinks((prev) => ({ ...prev, [id]: clampCount(value) }))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!closer) {
      setMessage({ type: 'error', text: '마감자를 선택해 주세요' })
      return
    }
    setStatus('saving')
    setMessage(null)
    try {
      await saveDailySales(dateKey, { drinks, closer, note: note.trim() })
      const time = new Date().toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
      })
      setMessage({ type: 'ok', text: `${time}에 저장되었습니다 (마감자: ${closer})` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setStatus('ready')
    }
  }

  const isToday = dateKey === todayKey()

  const datePicker = (
    <div className="date-row">
      <label className="date-label" htmlFor="entry-date-input">
        날짜
      </label>
      <input
        id="entry-date-input"
        className="date-input"
        type="date"
        value={dateKey}
        max={todayKey()}
        onChange={(e) => {
          if (e.target.value) setDateKey(e.target.value)
        }}
      />
      {!isToday && (
        <button
          type="button"
          className="today-btn"
          onClick={() => setDateKey(todayKey())}
        >
          오늘로
        </button>
      )}
    </div>
  )

  if (status === 'loading') {
    return (
      <div className="view">
        <p className="entry-date">{formatDateKey(dateKey)}</p>
        {datePicker}
        <p className="empty-note">기록을 불러오는 중…</p>
      </div>
    )
  }

  return (
    <div className="view">
      <p className="entry-date">{formatDateKey(dateKey)}</p>
      {datePicker}
      {isToday ? (
        <p className="entry-hint">오늘 판매한 잔 수를 입력해 주세요</p>
      ) : (
        <p className="date-warn">지난 날짜의 기록을 입력하고 있어요</p>
      )}

      {TEAS.map((tea) => (
        <section key={tea.id} className="tea-section">
          <h2 className="tea-title">{tea.name}</h2>
          <ul className="drink-list">
            {VARIANTS.map((variant) => {
              const id = itemId(tea.id, variant.id)
              return (
                <li key={id} className="drink-row">
                  <span className={`drink-temp temp-${variant.id}`}>
                    {variant.label}
                  </span>
                  <div className="stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      aria-label={`${tea.name} ${variant.label} 1잔 빼기`}
                      onClick={() => update(id, (drinks[id] || 0) - 1)}
                    >
                      −
                    </button>
                    <input
                      className="stepper-input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="999"
                      value={drinks[id] ?? 0}
                      aria-label={`${tea.name} ${variant.label} 잔 수`}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(id, e.target.valueAsNumber)}
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      aria-label={`${tea.name} ${variant.label} 1잔 더하기`}
                      onClick={() => update(id, (drinks[id] || 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <div className="entry-total">
        <span>오늘 판매 합계 (직원 제외)</span>
        <strong>{soldTotal(drinks)}잔</strong>
      </div>
      <div className="entry-total sub">
        <span>직원 소비</span>
        <span>{staffTotal(drinks)}잔</span>
      </div>

      <section className="closer-section">
        <h2 className="tea-title">특이사항</h2>
        <textarea
          className="note-input"
          rows={3}
          maxLength={500}
          placeholder="예: 우유 재고 부족, 오후에 단체 손님, 기계 이상 등"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setMessage(null)
          }}
        />
      </section>

      <section className="closer-section">
        <h2 className="tea-title">마감자</h2>
        <div className="closer-picker" role="radiogroup" aria-label="마감자 선택">
          {CLOSERS.map((name) => (
            <button
              type="button"
              key={name}
              role="radio"
              aria-checked={closer === name}
              className={`closer-btn${closer === name ? ' selected' : ''}`}
              onClick={() => {
                setCloser(name)
                setMessage(null)
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="save-btn"
        disabled={status === 'saving'}
        onClick={handleSave}
      >
        {status === 'saving' ? '저장 중…' : '저장하기'}
      </button>
      {message && (
        <p className={message.type === 'ok' ? 'save-note' : 'error-note'}>
          {message.text}
        </p>
      )}
    </div>
  )
}
