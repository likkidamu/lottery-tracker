import { useState } from 'react'
import { getGames, saveGame, deleteGame, generateId } from '../db'

export default function GameManager() {
  const [games, setGames] = useState(getGames())
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', totalTickets: '' })

  function reload() { setGames(getGames()) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.totalTickets) return
    const game = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      price: parseFloat(form.price),
      totalTickets: parseInt(form.totalTickets, 10),
      createdAt: editing?.createdAt || Date.now(),
    }
    saveGame(game)
    setEditing(null)
    setForm({ name: '', price: '', totalTickets: '' })
    reload()
  }

  function startEdit(game) {
    setEditing(game)
    setForm({ name: game.name, price: game.price, totalTickets: game.totalTickets })
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this game from the database?')) return
    deleteGame(id)
    reload()
  }

  const gameList = Object.values(games)

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Games Database</h2>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>{editing ? 'Edit Game' : 'Add Game Manually'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Game Name</label>
            <input
              className="input"
              placeholder="e.g. Win $5 Gold"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Price per Ticket ($)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Total Tickets per Pack</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="1000"
                value={form.totalTickets}
                onChange={e => setForm(f => ({ ...f, totalTickets: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {editing && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setEditing(null); setForm({ name: '', price: '', totalTickets: '' }) }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update Game' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Saved Games ({gameList.length})</h3>
        {gameList.length === 0 ? (
          <div className="empty">
            No games yet. Games are auto-saved when you scan a new barcode,<br />or add them manually above.
          </div>
        ) : (
          gameList.map(game => (
            <div className="list-row" key={game.id}>
              <div>
                <span style={{ fontWeight: 600 }}>{game.name}</span>
                <span className="muted"> · ${game.price}/ticket · {game.totalTickets} tickets/pack</span>
              </div>
              <div className="list-row-actions">
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(game)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
