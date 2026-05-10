import { useState, useEffect } from 'react'
import { getActiveWindow } from './db'
import Dashboard from './components/Dashboard'
import WindowView from './components/WindowView'
import History from './components/History'
import GameManager from './components/GameManager'
import './App.css'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [activeWindow, setActiveWindow] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setActiveWindow(getActiveWindow())
  }, [tick])

  const reload = () => setTick(t => t + 1)

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <span className="header-icon">LT</span>
          Lottery Tracker
        </div>
        <nav className="nav">
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          {activeWindow && (
            <button
              className={`nav-btn nav-live ${view === 'window' ? 'active' : ''}`}
              onClick={() => setView('window')}
            >
              Live Window
            </button>
          )}
          <button
            className={`nav-btn ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            History
          </button>
          <button
            className={`nav-btn ${view === 'games' ? 'active' : ''}`}
            onClick={() => setView('games')}
          >
            Games DB
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'dashboard' && (
          <Dashboard activeWindow={activeWindow} reload={reload} setView={setView} />
        )}
        {view === 'window' && (
          <WindowView activeWindow={activeWindow} reload={reload} setView={setView} />
        )}
        {view === 'history' && <History />}
        {view === 'games' && <GameManager />}
      </main>
    </div>
  )
}
