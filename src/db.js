const GAMES_KEY = 'lt_games'
const WINDOWS_KEY = 'lt_windows'

export function getGames() {
  return JSON.parse(localStorage.getItem(GAMES_KEY) || '{}')
}

export function saveGame(game) {
  const games = getGames()
  games[game.id] = game
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}

export function deleteGame(id) {
  const games = getGames()
  delete games[id]
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}

export function getWindows() {
  return JSON.parse(localStorage.getItem(WINDOWS_KEY) || '[]')
}

export function getActiveWindow() {
  return getWindows().find(w => w.status === 'open') || null
}

export function saveWindow(win) {
  const windows = getWindows()
  const idx = windows.findIndex(w => w.id === win.id)
  if (idx >= 0) windows[idx] = win
  else windows.unshift(win)
  localStorage.setItem(WINDOWS_KEY, JSON.stringify(windows))
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Barcode: last 3 digits = ticket number, rest = game ID
export function parseBarcode(barcode) {
  const cleaned = barcode.trim()
  if (cleaned.length < 4) return null
  return {
    gameId: cleaned.slice(0, -3),
    ticketNumber: parseInt(cleaned.slice(-3), 10),
  }
}

// Calculate sales for a given set of scans (for one box, sorted by time)
export function calcBoxSales(scans) {
  let totalSold = 0
  let currentStart = null
  let lastScan = null
  let gamePrice = 0
  let gameTotalTickets = 0

  const sorted = [...scans].sort((a, b) => a.timestamp - b.timestamp)

  for (const scan of sorted) {
    gamePrice = scan.gamePrice || 0
    gameTotalTickets = scan.gameTotalTickets || 0
    lastScan = scan

    if (scan.type === 'start' || scan.type === 'new_pack') {
      currentStart = scan.ticketNumber
    } else if (scan.type === 'end') {
      if (currentStart !== null) {
        totalSold += Math.max(0, scan.ticketNumber - currentStart)
        currentStart = null
      }
    }
  }

  const remaining =
    gameTotalTickets && lastScan ? Math.max(0, gameTotalTickets - lastScan.ticketNumber) : null

  return {
    totalSold,
    revenue: totalSold * gamePrice,
    remaining,
    hasOpenSegment: currentStart !== null,
    gamePrice,
    gameTotalTickets,
    lastScan,
  }
}

// Group window scans by box number and compute sales
export function calcWindowSales(window) {
  const byBox = {}
  for (const scan of window.scans) {
    if (!byBox[scan.boxNumber]) byBox[scan.boxNumber] = []
    byBox[scan.boxNumber].push(scan)
  }

  return Object.entries(byBox)
    .map(([boxNumber, scans]) => {
      const sorted = [...scans].sort((a, b) => a.timestamp - b.timestamp)
      const latest = sorted[sorted.length - 1]
      const sales = calcBoxSales(sorted)
      return {
        boxNumber: parseInt(boxNumber),
        gameName: latest?.gameName || 'Unknown',
        scans: sorted,
        ...sales,
      }
    })
    .sort((a, b) => a.boxNumber - b.boxNumber)
}
