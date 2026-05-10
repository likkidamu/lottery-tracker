import { saveWindow, generateId, getWindows, calcWindowSales } from '../db'

export default function Dashboard({ activeWindow, reload, setView }) {
  const windows = getWindows()

  const todayClosed = windows.filter(w => {
    const today = new Date().toDateString()
    return w.status === 'closed' && new Date(w.openedAt).toDateString() === today
  })

  // Aggregate today's sales from all closed windows
  const allBoxSales = todayClosed.flatMap(w => calcWindowSales(w))
  const grouped = {}
  for (const s of allBoxSales) {
    if (!grouped[s.boxNumber]) grouped[s.boxNumber] = { ...s }
    else {
      grouped[s.boxNumber].totalSold += s.totalSold
      grouped[s.boxNumber].revenue += s.revenue
    }
  }
  const todaySales = Object.values(grouped).sort((a, b) => a.boxNumber - b.boxNumber)
  const totalRevenue = todaySales.reduce((s, r) => s + r.revenue, 0)
  const totalSold = todaySales.reduce((s, r) => s + r.totalSold, 0)

  function openWindow() {
    const w = {
      id: generateId(),
      openedAt: Date.now(),
      closedAt: null,
      status: 'open',
      scans: [],
    }
    saveWindow(w)
    reload()
    setView('window')
  }

  return (
    <div>
      {/* Window status card */}
      {activeWindow ? (
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="card-header">
            <div>
              <h2>Window is Open</h2>
              <p className="muted">
                Started at {new Date(activeWindow.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setView('window')}>
              Go to Window →
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>No Active Window</h2>
              <p className="muted">Open a window to start scanning tickets for the day.</p>
            </div>
            <button className="btn btn-primary" onClick={openWindow}>
              Open Window
            </button>
          </div>
        </div>
      )}

      {/* Today's summary */}
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Today's Summary</h2>
        {todaySales.length === 0 ? (
          <div className="empty">No closed windows yet today.</div>
        ) : (
          <>
            <div className="summary-grid">
              <div className="summary-box">
                <div className="num">{totalSold}</div>
                <div className="label">Tickets Sold</div>
              </div>
              <div className="summary-box">
                <div className="num">${totalRevenue.toFixed(2)}</div>
                <div className="label">Revenue</div>
              </div>
              <div className="summary-box">
                <div className="num">{todaySales.length}</div>
                <div className="label">Boxes Active</div>
              </div>
            </div>
            <hr />
            {todaySales.map(s => (
              <div className="stat-row" key={s.boxNumber}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="box-number">#{s.boxNumber}</span>
                  <span>{s.gameName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600 }}>${s.revenue.toFixed(2)}</span>
                  <span className="muted" style={{ marginLeft: '0.5rem' }}>{s.totalSold} tickets</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Recent windows */}
      {windows.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Recent Windows</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setView('history')}>
              View All
            </button>
          </div>
          {windows.slice(0, 3).map(w => {
            const sales = calcWindowSales(w)
            const rev = sales.reduce((s, r) => s + r.revenue, 0)
            const sold = sales.reduce((s, r) => s + r.totalSold, 0)
            return (
              <div className="stat-row" key={w.id}>
                <div>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(w.openedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="muted" style={{ marginLeft: '0.5rem' }}>
                    {new Date(w.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {w.closedAt
                      ? ` – ${new Date(w.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : ' – open'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {w.status === 'open' ? (
                    <span className="badge badge-open">Open</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600 }}>${rev.toFixed(2)}</span>
                      <span className="muted" style={{ marginLeft: '0.5rem' }}>{sold} tickets</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
