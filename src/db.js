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

// Barcode label format:  1831-0255114-010(004)
//   1831     = game code (4 digits)
//   0255114  = pack number (7 digits)
//   010      = ticket position, reverse indexed (3 digits)
//   (004)    = total tickets in pack — printed on label, encoded into last 10 digits by scanner
//
// Raw scanner output:    183102551140107487948662  (24 digits)
//   first 11 digits = game ID  → "18310255114"  (1831 + 0255114)
//   next  3 digits  = ticket#  → "010"
//   last 10 digits  = GS1 encoded (004), cannot be decoded → ignored
//
// Reverse index: 000 = first ticket (pack full), totalTickets-1 = last ticket
// Total tickets entered manually (just look at printed label e.g. "(004)" = 4)
export function parseBarcode(barcode) {
  const digits = barcode.trim().replace(/\D/g, '')
  // 11 (gameId) + 3 (ticket#) + 10 (encoded extra) = 24 digits minimum
  if (digits.length < 14) return null
  return {
    gameId: digits.slice(0, 11),              // always first 11 digits
    ticketNumber: parseInt(digits.slice(11, 14), 10), // digits 12-14
    totalTickets: null,                        // read from printed label, entered manually
  }
}

// Remaining tickets = totalTickets - 1 - barcodeNumber
// (barcodeNumber 000 = pack full with totalTickets-1 behind it)
export function calcRemaining(totalTickets, barcodeNumber) {
  if (!totalTickets && totalTickets !== 0) return null
  return Math.max(0, totalTickets - 1 - barcodeNumber)
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
    gameTotalTickets && lastScan ? calcRemaining(gameTotalTickets, lastScan.ticketNumber) : null

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
