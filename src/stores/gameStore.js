import { reactive } from 'vue'

export const gameStore = reactive({
  // ── Player ──
  playerPos: { x: 0, y: 0 },
  money: 1000,
  turnCount: 0,
  name: '探險家',

  // ── Grid ──
  GRID: 20,
  tileSize: 48,
  grid: [],        // 2D array: [{ biome, visited, hasEvent, owner, building }]
  visitedCount: 0,

  // ── Exploration ──
  discoveredBiomes: new Set(),
  treasuresFound: 0,
  totalTreasures: 5,

  // ── Treasure System (新) ──
  treasures: [],           // [{x, y, found: bool, biome: string}]
  gameWon: false,
  nearestTreasureDir: null,  // "東北", "西南" etc
  nearestTreasureDist: Infinity,

  // ── Properties (Stage 2) ──
  ownedProperties: [],
  investments: [], // [{x, y, type, level, income}]

  // ── Game phase ──
  phase: 'explore',  // 'explore' | 'event' | 'shop' | 'gameover'
  isAnimating: false,
  showEventModal: false,
  currentEvent: null,
  gameStarted: false,

  // ── Computed-like helpers ──
  formatMoney(amount) {
    return '$' + Number(amount ?? this.money).toLocaleString()
  },

  canMoveTo(x, y) {
    const dx = Math.abs(x - this.playerPos.x)
    const dy = Math.abs(y - this.playerPos.y)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
  },

  isInBounds(x, y) {
    return x >= 0 && x < this.GRID && y >= 0 && y < this.GRID
  },

  moveTo(x, y) {
    this.playerPos.x = x
    this.playerPos.y = y
    const cell = this.grid[y][x]
    if (!cell.visited) {
      cell.visited = true
      this.visitedCount++
    }
    // Update compass hint after moving
    this.updateCompassHint()
  },

  addMoney(amount) {
    this.money = Math.max(0, this.money + amount)
  },

  resetTurn() {
    this.turnCount++
    this.showEventModal = false
    this.currentEvent = null
    this.isAnimating = false
  },

  // ── Treasure System ──

  placeTreasures() {
    const biomePriority = ['tile-desert', 'tile-jungle', 'tile-river', 'tile-mine', 'tile-market']
    const treasures = []
    const usedBiomes = new Set()

    // Deterministic placement by scanning grid
    for (let attempt = 0; attempt < 200; attempt++) {
      if (treasures.length >= 5) break

      // Pick a random cell
      const x = ((attempt * 17 + 31) % (this.GRID - 2)) + 1  // avoid edge
      const y = ((attempt * 13 + 47) % (this.GRID - 2)) + 1
      const cell = this.grid[y]?.[x]
      if (!cell) continue

      // Skip start tile
      if (x === 0 && y === 0) continue

      // Check minimum distance 5 from start
      const distFromStart = Math.sqrt(x*x + y*y)
      if (distFromStart < 5) continue

      // Check minimum distance 3 from other treasures
      let tooClose = false
      for (const t of treasures) {
        if (Math.sqrt((x-t.x)**2 + (y-t.y)**2) < 4) { tooClose = true; break }
      }
      if (tooClose) continue

      // Prefer biomes we haven't used yet
      const targetBiome = biomePriority[treasures.length]
      if (cell.biome === targetBiome || usedBiomes.size >= biomePriority.length) {
        treasures.push({ x, y, found: false, biome: cell.biome })
        usedBiomes.add(cell.biome)
      }
    }

    // Fallback: if we couldn't find enough, place remaining randomly
    while (treasures.length < 5) {
      const x = Math.floor(Math.random() * (this.GRID - 2)) + 1
      const y = Math.floor(Math.random() * (this.GRID - 2)) + 1
      if (x === 0 && y === 0) continue
      let dup = false
      for (const t of treasures) {
        if (t.x === x && t.y === y) { dup = true; break }
      }
      if (!dup) treasures.push({ x, y, found: false, biome: this.grid[y][x]?.biome || 'tile-grass' })
    }

    this.treasures = treasures
    this.treasuresFound = 0
    this.gameWon = false
    this.updateCompassHint()
  },

  collectTreasure(x, y) {
    const t = this.treasures.find(t => t.x === x && t.y === y && !t.found)
    if (!t) return false
    t.found = true
    this.treasuresFound++
    this.addMoney(200)
    this.updateCompassHint()
    return true
  },

  checkWin() {
    if (this.treasuresFound >= 5) {
      this.gameWon = true
      this.phase = 'gameover'
      return true
    }
    return false
  },

  updateCompassHint() {
    let nearest = null
    let minDist = Infinity

    for (const t of this.treasures) {
      if (t.found) continue
      const dx = t.x - this.playerPos.x
      const dy = t.y - this.playerPos.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist < minDist) {
        minDist = dist
        nearest = { dx, dy, dist }
      }
    }

    if (!nearest || nearest.dist <= 3) {
      // Within 3 tiles: no compass hint needed, tile glow handles it
      this.nearestTreasureDir = null
      this.nearestTreasureDist = Infinity
      return
    }

    this.nearestTreasureDist = Math.round(nearest.dist)

    // Convert dx, dy to 8-direction compass
    const angle = Math.atan2(-nearest.dy, nearest.dx) * 180 / Math.PI  // -dy because y-axis is flipped
    const dirs = [
      { min:-157.5, max:-112.5, label:'北' },
      { min:-112.5, max:-67.5,  label:'東北' },
      { min:-67.5,  max:-22.5,  label:'東' },
      { min:-22.5,  max:22.5,   label:'東南' },
      { min:22.5,   max:67.5,   label:'南' },
      { min:67.5,   max:112.5,  label:'西南' },
      { min:112.5,  max:157.5,  label:'西' },
      { min:157.5,  max:180,    label:'西北' },
      { min:-180,   max:-157.5, label:'西北' },
    ]
    const dir = dirs.find(d => angle >= d.min && angle < d.max)
    this.nearestTreasureDir = dir ? dir.label : '—'
  },

  // ── Grid generation ──
  generateGrid(seed = Date.now()) {
    const grid = []
    for (let y = 0; y < this.GRID; y++) {
      const row = []
      for (let x = 0; x < this.GRID; x++) {
        const biome = this.pickBiome(x, y)
        row.push({
          x, y,
          biome,
          visited: false,
          hasEvent: true,
          owner: null,
          building: null,
        })
      }
      grid.push(row)
    }
    // Force start tile
    grid[0][0].biome = 'tile-start'
    grid[0][0].visited = true
    this.grid = grid
    this.playerPos = { x: 0, y: 0 }
    this.visitedCount = 1
    this.visitedGrid.clear()

    // Place treasures after grid is ready
    this.placeTreasures()
    return grid
  },

  // Simple noise-based biome placement
  pickBiome(x, y) {
    const cx = (this.GRID - 1) / 2
    const cy = (this.GRID - 1) / 2
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    const maxDist = Math.sqrt(cx ** 2 + cy ** 2)
    const ratio = dist / maxDist
    const h = (x * 7 + y * 13 + 31) % 100 / 100

    if (ratio > 0.7) {
      if (h < 0.45) return 'tile-grass'
      if (h < 0.7) return 'tile-desert'
      if (h < 0.88) return 'tile-river'
      return 'tile-jungle'
    } else if (ratio > 0.35) {
      if (h < 0.3) return 'tile-jungle'
      if (h < 0.55) return 'tile-desert'
      if (h < 0.73) return 'tile-river'
      if (h < 0.88) return 'tile-mine'
      return 'tile-grass'
    } else {
      if (h < 0.35) return 'tile-village'
      if (h < 0.6) return 'tile-market'
      if (h < 0.78) return 'tile-mine'
      return 'tile-jungle'
    }
  },
})

// For tracking visited cells during movement (avoid re-triggering events)
// ── Save / Load ──
gameStore.saveProgress = function() {
  try {
    // Save full grid biome data + visited state for restore
    const gridData = this.grid.map(row => row.map(cell => ({
      biome: cell.biome,
      visited: cell.visited,
      owner: cell.owner,
      building: cell.building,
    })))

    const data = {
      playerPos: { ...this.playerPos },
      money: this.money,
      turnCount: this.turnCount,
      name: this.name,
      visitedCount: this.visitedCount,
      treasuresFound: this.treasuresFound,
      totalTreasures: this.totalTreasures,
      gameWon: this.gameWon,
      treasures: this.treasures.map(t => ({ ...t })),
      grid: gridData,
      ownedProperties: JSON.parse(JSON.stringify(this.ownedProperties)),
    }
    localStorage.setItem('africa2_save', JSON.stringify(data))
    return true
  } catch (e) {
    console.warn('Save failed:', e)
    return false
  }
}

gameStore.loadProgress = function() {
  try {
    const raw = localStorage.getItem('africa2_save')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) { return null }
}

gameStore.restoreFromSave = function(saved) {
  if (!saved) return false
  // Restore scalar values
  this.playerPos = saved.playerPos || { x: 0, y: 0 }
  this.money = saved.money ?? 1000
  this.turnCount = saved.turnCount ?? 0
  this.name = saved.name || '探險家'
  this.visitedCount = saved.visitedCount ?? 1
  this.treasuresFound = saved.treasuresFound ?? 0
  this.totalTreasures = saved.totalTreasures ?? 5
  this.gameWon = saved.gameWon ?? false
  this.treasures = (saved.treasures || []).map(t => ({ ...t }))
  this.ownedProperties = saved.ownedProperties ? JSON.parse(JSON.stringify(saved.ownedProperties)) : []

  // Restore full grid
  if (saved.grid && saved.grid.length === this.GRID) {
    for (let y = 0; y < this.GRID; y++) {
      for (let x = 0; x < this.GRID; x++) {
        if (!this.grid[y]) this.grid[y] = []
        if (saved.grid[y] && saved.grid[y][x]) {
          this.grid[y][x] = {
            x, y,
            biome: saved.grid[y][x].biome || 'tile-grass',
            visited: saved.grid[y][x].visited || false,
            hasEvent: true,
            owner: saved.grid[y][x].owner || null,
            building: saved.grid[y][x].building || null,
          }
        }
      }
    }
  }

  // Restore visitedGrid from grid data
  this.visitedGrid = new Set()
  for (let y = 0; y < this.GRID; y++) {
    for (let x = 0; x < this.GRID; x++) {
      if (this.grid[y]?.[x]?.visited) {
        this.visitedGrid.add(`${x},${y}`)
      }
    }
  }

  this.updateCompassHint()
  this.gameStarted = true
  this.phase = 'explore'
  return true
}

gameStore.clearProgress = function() {
  localStorage.removeItem('africa2_save')
  this.resetGame()
}

gameStore.resetGame = function() {
  this.playerPos = { x: 0, y: 0 }
  this.money = 1000
  this.turnCount = 0
  this.visitedCount = 1
  this.treasuresFound = 0
  this.totalTreasures = 5
  this.gameWon = false
  this.ownedProperties = []
  this.treasures = []
  this.currentEvent = null
  this.showEventModal = false
  this.isAnimating = false
  this.phase = 'explore'
  this.nearestTreasureDir = null
  this.nearestTreasureDist = Infinity
  this.gameStarted = false
  if (this.visitedGrid) this.visitedGrid.clear()
}

gameStore.visitedGrid = new Set()
