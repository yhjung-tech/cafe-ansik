import { useState } from 'react'
import EntryView from './EntryView.jsx'
import TrendView from './TrendView.jsx'

function App() {
  const [tab, setTab] = useState('entry')

  return (
    <div className="app">
      <header className="app-header">
        <h1>카페 안식</h1>
        <p>음료 판매 기록</p>
      </header>

      <main className="app-main">
        {tab === 'entry' ? <EntryView /> : <TrendView />}
      </main>

      <nav className="tab-bar" aria-label="화면 전환">
        <button
          type="button"
          className={tab === 'entry' ? 'active' : ''}
          aria-current={tab === 'entry' ? 'page' : undefined}
          onClick={() => setTab('entry')}
        >
          ✏️ 입력
        </button>
        <button
          type="button"
          className={tab === 'trend' ? 'active' : ''}
          aria-current={tab === 'trend' ? 'page' : undefined}
          onClick={() => setTab('trend')}
        >
          📈 추이
        </button>
      </nav>
    </div>
  )
}

export default App
