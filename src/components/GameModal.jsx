import { useState } from 'react'

export default function GameModal({ onSave, onCancel, gameId, totalTickets }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState(totalTickets ? String(totalTickets) : '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !price || !total) return
    onSave({ name: name.trim(), price: parseFloat(price), totalTickets: parseInt(total, 10) })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>New Game Found</h2>
        <p className="muted" style={{ marginBottom: '1.25rem' }}>
          Game ID: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{gameId}</code>
          <br />This game isn't in your database. Add its details:
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Game Name</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Win $5 Gold, Lucky 7 $10"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Price per Ticket ($)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-group">
            <label>Total Tickets per Pack <span className="muted">(check printed label e.g. "(004)" = 4)</span></label>
            <input
              className="input"
              type="number"
              min="1"
              value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save &amp; Record</button>
          </div>
        </form>
      </div>
    </div>
  )
}
