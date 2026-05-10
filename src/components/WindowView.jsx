import { useState, useRef, useEffect } from 'react'
import { parseBarcode, getGames, saveGame, saveWindow, generateId, calcWindowSales } from '../db'
import GameModal from './GameModal'

export default function WindowView({ activeWindow, reload, setView }) {
  const [scanType, setScanType] = useState('start')
  const [boxNumber, setBoxNumber] = useState('')
  const [barcode, setBarcode] = useState('')
  const [pendingGame, setPendingGame] = useState(null)
  const [toast, setToast] = useState(null)
  const scanRef = useRef()
  const boxRef = useRef()

  useEffect(() => {
    scanRef.current?.focus()
  }, [scanType, activeWindow])

  if (!activeWindow) {
    return (
      <div className="card">
        <p>No active window. <button className="btn btn-primary" onClick={() => setView('dashboard')}>Go to Dashboard</button></p>
      </div>
    )
  }

  const games = getGames()
  const boxSales = calcWindowSales(activeWindow)

  function flash(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleScan(e) {
    e.preventDefault()
    const raw = barcode.trim()
    if (!raw) { scanRef.current?.focus(); return }
    if (!boxNumber || isNaN(parseInt(boxNumber)) || parseInt(boxNumber) < 1 || parseInt(boxNumber) > 100) {
      flash('Enter a valid box number (1–100) first.', 'error')
      boxRef.current?.focus()
      return
    }

    const parsed = parseBarcode(raw)
    if (!parsed) {
      flash('Barcode too short — need at least 4 characters.', 'error')
      setBarcode('')
      scanRef.current?.focus()
      return
    }

    const game = games[parsed.gameId]
    if (!game) {
      setPendingGame({ ...parsed, rawBarcode: raw, type: scanType, boxNum: parseInt(boxNumber) })
      setBarcode('')
      return
    }

    recordScan(parseInt(boxNumber), parsed.gameId, parsed.ticketNumber, raw, game)
  }

  function recordScan(boxNum, gameId, ticketNumber, rawBarcode, game) {
    const scan = {
      id: generateId(),
      boxNumber: boxNum,
      gameId,
      gameName: game.name,
      gamePrice: game.price,
      gameTotalTickets: game.totalTickets,
      type: scanType,
      ticketNumber,
      rawBarcode,
      timestamp: Date.now(),
    }
    const updated = { ...activeWindow, scans: [...activeWindow.scans, scan] }
    saveWindow(updated)
    reload()

    const typeLabel = scanType === 'start' ? 'Start' : scanType === 'new_pack' ? 'New Pack' : 'End'
    const remaining = game.totalTickets - ticketNumber
    flash(
      `Box #${boxNum} · ${game.name} · Ticket #${String(ticketNumber).padStart(3, '0')} recorded as ${typeLabel}` +
      (scanType === 'end' ? ` · ${remaining} tickets remaining` : ''),
      'success'
    )
    setBarcode('')
    scanRef.current?.focus()
  }

  function handleNewGame(gameData) {
    const game = {
      id: pendingGame.gameId,
      name: gameData.name,
      price: gameData.price,
      totalTickets: gameData.totalTickets,
      createdAt: Date.now(),
    }
    saveGame(game)
    recordScan(pendingGame.boxNum, pendingGame.gameId, pendingGame.ticketNumber, pendingGame.rawBarcode, game)
    setPendingGame(null)
  }

  function closeWindow() {
    if (!window.confirm('Close this window? Make sure you have scanned END for all active boxes.')) return
    const updated = { ...activeWindow, status: 'closed', closedAt: Date.now() }
    saveWindow(updated)
    reload()
    setView('dashboard')
  }

  const typeConfig = {
    start:    { label: 'Start of Day',   badge: 'badge-start', color: '#16a34a' },
    new_pack: { label: 'New Pack Added', badge: 'badge-pack',  color: '#d97706' },
    end:      { label: 'End of Day',     badge: 'badge-end',   color: '#dc2626' },
  }

  return (
    <div>
      {pendingGame && (
        <GameModal
          gameId={pendingGame.gameId}
          onSave={handleNewGame}
          onCancel={() => { setPendingGame(null); setBarcode(''); scanRef.current?.focus() }}
        />
      )}

      {/* Scan panel */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Active Window</h2>
            <p className="muted">
              Opened {new Date(activeWindow.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button className="btn btn-danger" onClick={closeWindow}>Close Window</button>
        </div>

        {/* Scan type tabs */}
        <div className="tabs">
          <button
            className={`tab tab-start ${scanType === 'start' ? 'active' : ''}`}
            onClick={() => { setScanType('start'); scanRef.current?.focus() }}
          >
            Start of Day
          </button>
          <button
            className={`tab tab-pack ${scanType === 'new_pack' ? 'active' : ''}`}
            onClick={() => { setScanType('new_pack'); scanRef.current?.focus() }}
          >
            + New Pack
          </button>
          <button
            className={`tab tab-end ${scanType === 'end' ? 'active' : ''}`}
            onClick={() => { setScanType('end'); scanRef.current?.focus() }}
          >
            End of Day
          </button>
        </div>

        <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          {scanType === 'start' && 'Scan each box at window open to record starting ticket numbers.'}
          {scanType === 'new_pack' && 'Scan old pack as END first, then scan new pack here.'}
          {scanType === 'end' && 'Scan each box at window close to calculate tickets sold.'}
        </p>

        {/* Box number + barcode input */}
        <form onSubmit={handleScan}>
          <div className="scan-row" style={{ marginBottom: '0.75rem' }}>
            <div className="box-input-wrap">
              <span className="box-input-label">BOX</span>
              <input
                ref={boxRef}
                className="box-num-input"
                type="number"
                min="1"
                max="100"
                value={boxNumber}
                onChange={e => setBoxNumber(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); scanRef.current?.focus() } }}
                placeholder="1"
              />
            </div>
            <input
              ref={scanRef}
              className="input-scan"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan barcode or type here, then Enter..."
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary">Record</button>
          </div>
        </form>

        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.msg}
          </div>
        )}
      </div>

      {/* Live scan log per box */}
      {boxSales.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem' }}>Scans This Window</h3>
          {boxSales.map(box => (
            <div className="box-group" key={box.boxNumber}>
              <div className="box-group-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="box-number">#{box.boxNumber}</span>
                  <span style={{ fontWeight: 600 }}>{box.gameName}</span>
                  {box.gamePrice > 0 && (
                    <span className="muted">${box.gamePrice}/ticket</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {box.totalSold > 0 && (
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>
                      {box.totalSold} sold · ${box.revenue.toFixed(2)}
                    </span>
                  )}
                  {box.remaining !== null && (
                    <span className="muted">{box.remaining} remaining</span>
                  )}
                  {box.hasOpenSegment && (
                    <span className="badge badge-open">Ongoing</span>
                  )}
                </div>
              </div>
              <div className="box-group-body">
                {box.scans.map(s => (
                  <div className="scan-entry" key={s.id}>
                    <span className={`badge ${typeConfig[s.type]?.badge}`}>
                      {s.type === 'new_pack' ? 'New Pack' : s.type}
                    </span>
                    <span className="scan-num">#{String(s.ticketNumber).padStart(3, '0')}</span>
                    <span className="muted">
                      {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
