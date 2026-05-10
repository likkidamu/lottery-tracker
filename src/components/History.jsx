import { getWindows, calcWindowSales } from '../db'

export default function History() {
  const windows = getWindows().filter(w => w.status === 'closed')

  if (windows.length === 0) {
    return (
      <div className="card">
        <div className="empty">No closed windows yet.</div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Window History</h2>
      {windows.map(w => {
        const sales = calcWindowSales(w)
        const totalRev = sales.reduce((s, r) => s + r.revenue, 0)
        const totalSold = sales.reduce((s, r) => s + r.totalSold, 0)

        return (
          <div className="card" key={w.id}>
            <div className="card-header" style={{ marginBottom: '0.75rem' }}>
              <div>
                <h3>
                  {new Date(w.openedAt).toLocaleDateString([], {
                    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </h3>
                <p className="muted">
                  {new Date(w.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {w.closedAt
                    ? new Date(w.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'ongoing'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>${totalRev.toFixed(2)}</div>
                <div className="muted">{totalSold} tickets sold</div>
              </div>
            </div>

            {sales.length > 0 && (
              <>
                <hr />
                {sales.map(s => (
                  <div className="stat-row" key={s.boxNumber}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="box-number">#{s.boxNumber}</span>
                      <div>
                        <span>{s.gameName}</span>
                        {s.gamePrice > 0 && (
                          <span className="muted"> · ${s.gamePrice}/ticket</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>${s.revenue.toFixed(2)}</span>
                      <span className="muted" style={{ marginLeft: '0.5rem' }}>{s.totalSold} sold</span>
                      {s.remaining !== null && (
                        <span className="muted" style={{ marginLeft: '0.5rem' }}>· {s.remaining} left</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
