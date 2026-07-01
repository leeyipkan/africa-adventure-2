import Phaser from 'phaser'
import { dispatchGameEvent, onGameEvent, PHASER_EVENTS } from '../events.js'
import { gameStore } from '../../stores/gameStore.js'
import { soundManager } from '../SoundManager.js'

// ── Constants ──
const W = 960, H = 640
const TS = gameStore.tileSize       // 32
const GRID = gameStore.GRID          // 20
const MAP_W = GRID * TS             // 640
const MAP_H = GRID * TS

// ── Biome-specific event pools ──
const EVENTS = {
  'tile-grass': [
    { title:'草原漫步',       desc:'你喺廣闊嘅草原上漫步，微風吹過，好舒服。',          emoji:'🌾', money:15 },
    { title:'遇到長頸鹿',    desc:'一群長頸鹿喺前面食樹葉，好優雅！',                emoji:'🦒', money:10 },
    { title:'發現野果',      desc:'你搵到一大片野生莓果，摘咗啲來食。',              emoji:'🫐', money:5 },
    { title:'草原火災',      desc:'遠處有山火，你要繞路，浪費咗時間。',              emoji:'🔥', money:-20 },
  ],
  'tile-desert': [
    { title:'沙塵暴',        desc:'突然颳起超大沙塵暴！你要搵地方避難。',             emoji:'🌪️', money:-30 },
    { title:'綠洲發現',      desc:'你發現一個隱藏綠洲！有清澈嘅水源。',               emoji:'🌴', money:50 },
    { title:'沙漠狐狸',      desc:'一隻沙漠狐喺附近徘徊，好可愛。',                   emoji:'🦊', money:8 },
    { title:'古代遺跡',      desc:'你喺沙堆下發現古代遺跡碎片！',                     emoji:'🏛️', money:80 },
  ],
  'tile-river': [
    { title:'過河流',        desc:'你要搵路過河，好彩有條獨木橋。',                   emoji:'🌉', money:-5 },
    { title:'釣到大魚',      desc:'你用樹枝整咗支魚竿，釣到一條大魚！',               emoji:'🐟', money:30 },
    { title:'河馬襲擊',      desc:'一隻河馬突然由水入面衝出嚟！快啲走佬！',           emoji:'🦛', money:-40 },
    { title:'河邊紮營',      desc:'你喺河邊紮營休息，恢復體力。',                     emoji:'🏕️', money:10 },
  ],
  'tile-jungle': [
    { title:'叢林探險',      desc:'熱帶雨林好茂密，你要用刀開路前進。',               emoji:'🌴', money:-10 },
    { title:'發現金剛鸚鵡',  desc:'色彩繽紛嘅金剛鸚鵡喺頭頂飛過！',                   emoji:'🦜', money:15 },
    { title:'蟒蛇！',        desc:'一條大蟒蛇攔住去路！你慢慢後退繞路。',             emoji:'🐍', money:-25 },
    { title:'隱藏瀑布',      desc:'你發現一個隱藏瀑布，水清到見底！',                 emoji:'💧', money:60 },
    { title:'食人花',        desc:'差啲踩到食人花！好彩你避開得快。',                 emoji:'🌺', money:-15 },
  ],
  'tile-mine': [
    { title:'發現金礦',      desc:'你喺礦洞入面發現金礦脈！發達啦！',                 emoji:'🪙', money:100 },
    { title:'礦洞坍塌',      desc:'礦洞突然搖晃，有石頭跌落嚟！快啲走！',             emoji:'💥', money:-50 },
    { title:'古老工具',      desc:'你搵到以前礦工留低嘅工具，有啲用。',               emoji:'⛏️', money:25 },
    { title:'蝙蝠襲擊',      desc:'成千上萬蝙蝠由頭頂飛過，嚇死人！',                 emoji:'🦇', money:-10 },
  ],
  'tile-village': [
    { title:'村民款待',      desc:'熱情嘅村民請你食當地特色菜！',                     emoji:'🍲', money:20 },
    { title:'手工藝市場',    desc:'村民賣你一個手工雕刻嘅非洲動物擺設。',             emoji:'🎨', money:-15 },
    { title:'酋長召見',      desc:'村莊酋長召見你，俾咗你一個任務。',                 emoji:'👑', money:40 },
    { title:'學當地舞',      desc:'你同村民一齊跳舞，好開心！',                       emoji:'💃', money:5 },
  ],
  'tile-market': [
    { title:'繁忙市集',      desc:'市集好熱鬧，你買咗啲特別香料。',                   emoji:'🏪', money:-20 },
    { title:'稀有寶石',      desc:'你用低價買咗粒稀有寶石，轉手賺大錢！',            emoji:'💎', money:120 },
    { title:'駱駝交易',      desc:'你買咗一隻駱駝幫手運行李，好有用。',               emoji:'🐪', money:-35 },
    { title:'情報收集',      desc:'你喺市集收集到前方路況嘅有用情報。',               emoji:'🗺️', money:15 },
  ],
  'tile-start': [
    { title:'旅程開始',      desc:'準備好未？非洲探險而家正式開始！',                 emoji:'🚩', money:10 },
    { title:'裝備檢查',      desc:'你檢查咗吓背囊，發現仲有啲補給品。',              emoji:'🎒', money:15 },
  ],
}

// ── Generic events pool ──
const GENERIC_EVENTS = [
  { title:'炎熱天氣',   desc:'今日好熱，你飲咗好多水。',                     emoji:'☀️', money:-5 },
  { title:'好心司機',   desc:'一個貨車司機順路載咗你一程。',                 emoji:'🚚', money:0 },
  { title:'影相留念',   desc:'你影低咗一張好靚嘅風景相。',                   emoji:'📷', money:0 },
  { title:'蚊蟲叮咬',   desc:'俾非洲蚊咬到成手都係，好痕。',                 emoji:'🦟', money:-15 },
  { title:'星空觀測',   desc:'夜晚嘅非洲星空超級靚！你睇到銀河。',         emoji:'⭐', money:5 },
  { title:'當地朋友',   desc:'你識咗個當地朋友，佢教你幾句土著話。',     emoji:'🤝', money:10 },
  { title:'猴子偷食',   desc:'一隻頑皮嘅猴子偷走咗你嘅香蕉！',             emoji:'🐒', money:-10 },
  { title:'彩虹',       desc:'雨後出現一道超大彩虹，橫跨整個天空！',         emoji:'🌈', money:5 },
]

// ── Stage 2: Property / investment data ──
const PROPERTY_TYPES = [
  { id:'farm',   name:'農場',  cost:200, income:30,  icon:'🌽', desc:'種植玉米同咖啡' },
  { id:'mine',   name:'礦場',  cost:400, income:60,  icon:'⛏️', desc:'開採金礦同鑽石' },
  { id:'shop',   name:'商店',  cost:300, income:45,  icon:'🏪', desc:'開辦手工藝品店' },
  { id:'ranch',  name:'牧場',  cost:250, income:35,  icon:'🐄', desc:'飼養非洲動物' },
]

export class BoardScene extends Phaser.Scene {
  constructor() {
    super({ key:'BoardScene' })
    this.tileSprites = []     // array of {sprite, x, y, highlight}
    this.playerSprite = null
    this.highlights = []       // adjacent highlight overlays
    this.cleanup = []
    this.uiTexts = {}
    this.showPropertyShop = false
    this.swipeStart = null
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    // Check if we're continuing from a saved game (grid already restored)
    const isContinue = gameStore.grid.length > 0 && gameStore.grid[0] && gameStore.grid[0][0]

    if (!isContinue) {
      // Generate the 20×20 grid (new game only)
      gameStore.generateGrid()
      gameStore.visitedGrid.clear()
      gameStore.visitedGrid.add('0,0')
    } else {
      // Restore visitedGrid from already-restored grid data
      gameStore.visitedGrid = new Set()
      for (let y = 0; y < gameStore.GRID; y++) {
        for (let x = 0; x < gameStore.GRID; x++) {
          if (gameStore.grid[y]?.[x]?.visited) {
            gameStore.visitedGrid.add(`${x},${y}`)
          }
        }
      }
    }

    gameStore.updateCompassHint()

    // Draw the map
    this.drawGrid()

    // Reveal initial fog around start position (show 3×3 radius)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const rx = dx, ry = dy
        if (gameStore.isInBounds(rx, ry)) {
          this.revealTile(rx, ry)
          if (!gameStore.grid[ry][rx].visited) {
            gameStore.grid[ry][rx].visited = true
            gameStore.visitedCount++
          }
        }
      }
    }

    // Player
    this.createPlayer()

    // Treasure markers
    this.createdTreasureMarkers = []
    this.treasureGlows = []
    this.renderTreasureMarkers()

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H)
    this.cameras.main.startFollow(this.playerSprite, true, 0.09, 0.09)

    // Scene UI
    this.createSceneUI()

    // Input / event listeners
    this.setupInput()
    this.setupSwipeInput()
    this.listen()

    // Initial update
    this.updateHighlights()
    this.updateTreasureReveal()
    this.syncHUD()

    // Resume AudioContext on first interaction
    this.input.once('pointerdown', () => {
      soundManager._ensureCtx()
      soundManager.startBGM()
    })
  }

  /* ═══════════════════════════════════════════
     GRID RENDERING (Fog of War)
     ═══════════════════════════════════════════ */
  drawGrid() {
    const grid = gameStore.grid
    this.fogTiles = []  // {bg, border, x, y} for unvisited tiles
    this.tileSprites = []

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const cell = grid[y][x]
        const px = x * TS + TS / 2
        const py = y * TS + TS / 2

        // ── VISITED: show full tile sprite ──
        if (cell.visited) {
          const sprite = this.add.image(px, py, cell.biome)
          sprite.setScale(TS / 256)

          const border = this.add.graphics()
          border.lineStyle(1, 0x000000, 0.15)
          border.strokeRect(x * TS, y * TS, TS, TS)

          this.tileSprites.push({ sprite, border, x, y })
        } else {
          // ── UNVISITED: dark fog tile ──
          const bg = this.add.graphics()
          bg.fillStyle(0x0d0d1a, 1)
          bg.fillRect(x * TS, y * TS, TS, TS)

          // Subtle border so grid is still visible
          const border = this.add.graphics()
          border.lineStyle(1, 0x1a1a33, 0.3)
          border.strokeRect(x * TS, y * TS, TS, TS)

          this.fogTiles.push({ bg, border, x, y })
        }
      }
    }
  }

  /**
   * Reveal a fog tile when player first visits it
   */
  revealTile(x, y) {
    const cell = gameStore.grid[y]?.[x]
    if (!cell) return

    // Already revealed
    const idx = this.fogTiles.findIndex(t => t.x === x && t.y === y)
    if (idx === -1) return

    // Remove fog
    const fog = this.fogTiles[idx]
    fog.bg.destroy()
    fog.border.destroy()
    this.fogTiles.splice(idx, 1)

    // Add tile sprite
    const px = x * TS + TS / 2
    const py = y * TS + TS / 2
    const sprite = this.add.image(px, py, cell.biome)
    sprite.setScale(TS / 256)

    const border = this.add.graphics()
    border.lineStyle(1, 0x000000, 0.15)
    border.strokeRect(x * TS, y * TS, TS, TS)

    this.tileSprites.push({ sprite, border, x, y })
  }

  /* ═══════════════════════════════════════════
     TREASURE MARKERS
     ═══════════════════════════════════════════ */
  renderTreasureMarkers() {
    this.createdTreasureMarkers = []
    this.treasureGlows = []

    for (const t of gameStore.treasures) {
      const px = t.x * TS + TS / 2
      const py = t.y * TS + TS / 2

      // Glow (hidden by default, shown when within 3 tiles)
      const glow = this.add.graphics()
      glow.setDepth(2)
      this.treasureGlows.push({ glow, treasure: t })

      // Gold sparkle icon (visible only when found or within 3 tiles)
      const icon = this.add.text(px, py, '✦', {
        fontSize: '14px', color: '#ffd700',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4).setVisible(false)

      this.createdTreasureMarkers.push({ icon, treasure: t })
    }
  }

  updateTreasureReveal() {
    const px = gameStore.playerPos.x
    const py = gameStore.playerPos.y

    for (let i = 0; i < gameStore.treasures.length; i++) {
      const t = gameStore.treasures[i]
      const marker = this.createdTreasureMarkers[i]
      const glowData = this.treasureGlows[i]
      if (!marker || !glowData) continue

      if (t.found) {
        // Show collected checkmark
        marker.icon.setText('✔️')
        marker.icon.setVisible(true)
        glowData.glow.clear()
        // Add green checkmark
        const check = this.add.text(t.x * TS + TS - 4, t.y * TS + 4, '✔️', {
          fontSize: '10px',
        }).setOrigin(1, 0).setDepth(6)
        continue
      }

      const dx = t.x - px
      const dy = t.y - py
      const dist = Math.sqrt(dx*dx + dy*dy)

      if (dist <= 3) {
        // Show shimmer
        marker.icon.setVisible(true)
        glowData.glow.clear()
        glowData.glow.fillStyle(0xffd700, 0.15 + 0.1 * Math.sin(Date.now() / 300 + i))
        glowData.glow.fillCircle(t.x * TS + TS/2, t.y * TS + TS/2, TS * 0.7)
        glowData.glow.lineStyle(2, 0xffd700, 0.5)
        glowData.glow.strokeCircle(t.x * TS + TS/2, t.y * TS + TS/2, TS * 0.7)
      } else {
        marker.icon.setVisible(false)
        glowData.glow.clear()
      }
    }
  }

  /* ═══════════════════════════════════════════
     PLAYER
     ═══════════════════════════════════════════ */
  createPlayer() {
    const px = gameStore.playerPos.x * TS + TS / 2
    const py = gameStore.playerPos.y * TS + TS / 2

    this.playerSprite = this.add.image(px, py, 'player')
    this.playerSprite.setScale(TS / 128)   // 128 -> 32
    this.playerSprite.setDepth(5)

    // Pulsing glow
    this.tweens.add({
      targets: this.playerSprite,
      alpha: { from: 1, to: 0.6 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    })
  }

  /* ═══════════════════════════════════════════
     HIGHLIGHTS (valid moves)
     ═══════════════════════════════════════════ */
  updateHighlights() {
    // Remove old highlights
    this.highlights.forEach(h => h.destroy())
    this.highlights = []

    const { x, y } = gameStore.playerPos
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]]

    dirs.forEach(([dx, dy]) => {
      const nx = x + dx
      const ny = y + dy
      if (!gameStore.isInBounds(nx, ny)) return

      const wx = nx * TS     // world top-left x
      const wy = ny * TS     // world top-left y

      // Zone for click detection (positioned at tile center)
      const zone = this.add.zone(wx + TS / 2, wy + TS / 2, TS, TS)
      zone.setInteractive()
      zone.setData('tx', nx)
      zone.setData('ty', ny)
      zone.on('pointerdown', () => this.onTileClick(nx, ny))
      zone.setDepth(4)

      // Visual highlight (Graphics at tile world position, draw relative)
      const g = this.add.graphics()
      g.setPosition(wx, wy)
      g.fillStyle(0xffffff, 0.2)
      g.fillRoundedRect(1, 1, TS - 2, TS - 2, 4)
      g.lineStyle(2, 0xffffff, 0.4)
      g.strokeRoundedRect(1, 1, TS - 2, TS - 2, 4)
      g.setDepth(3)

      this.highlights.push(zone, g)
    })
  }

  /* ═══════════════════════════════════════════
     INPUT
     ═══════════════════════════════════════════ */
  setupInput() {}

  setupSwipeInput() {
    this.swipeStart = null

    this.input.on('pointerdown', (pointer) => {
      this.swipeStart = { x: pointer.downX, y: pointer.downY }
    })

    this.input.on('pointerup', (pointer) => {
      if (!this.swipeStart || gameStore.isAnimating || gameStore.showEventModal) {
        this.swipeStart = null
        return
      }
      const dx = pointer.upX - this.swipeStart.x
      const dy = pointer.upY - this.swipeStart.y
      const dist = Math.sqrt(dx*dx + dy*dy)

      if (dist < 30) {
        // Too short = just a tap/clicks — the zone handler handles it
        this.swipeStart = null
        return
      }

      // Determine dominant direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        const nx = gameStore.playerPos.x + (dx > 0 ? 1 : -1)
        if (gameStore.isInBounds(nx, gameStore.playerPos.y))
          this.onTileClick(nx, gameStore.playerPos.y)
      } else {
        // Vertical swipe
        const ny = gameStore.playerPos.y + (dy > 0 ? 1 : -1)
        if (gameStore.isInBounds(gameStore.playerPos.x, ny))
          this.onTileClick(gameStore.playerPos.x, ny)
      }
      this.swipeStart = null
    })
  }

  onTileClick(nx, ny) {
    if (gameStore.isAnimating || gameStore.showEventModal) return
    if (!gameStore.canMoveTo(nx, ny)) return

    soundManager.play('step')
    gameStore.isAnimating = true
    const targetX = nx * TS + TS / 2
    const targetY = ny * TS + TS / 2

    // Move in store
    gameStore.moveTo(nx, ny)
    gameStore.visitedGrid.add(`${nx},${ny}`)

    // Animate player movement
    this.tweens.add({
      targets: this.playerSprite,
      x: targetX,
      y: targetY,
      duration: 180,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Reveal destination tile + adjacent tiles (fog of war)
        this.revealTile(nx, ny)
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]]
        for (const [dx, dy] of dirs) {
          if (gameStore.isInBounds(nx+dx, ny+dy)) {
            // Reveal adjacent tiles even if not stepped on (fog expansion)
            this.revealTile(nx+dx, ny+dy)
            // Mark as visited for fog, but don't re-trigger events
            const adjCell = gameStore.grid[ny+dy][nx+dx]
            if (!adjCell.visited) {
              adjCell.visited = true
              gameStore.visitedCount++
            }
          }
        }

        this.updateHighlights()
        this.updateTreasureReveal()
        this.syncHUD()

        // Check if this tile has a treasure
        const collected = gameStore.collectTreasure(nx, ny)
        if (collected) {
          soundManager.play('treasure')
          this.updateTreasureReveal()
          // Check win
          const won = gameStore.checkWin()
          if (won) {
            soundManager.play('win')
            gameStore.currentEvent = {
              type: 'win',
              title: '🎉 恭喜曬！你贏咗！',
              description: `你成功收集晒全部 ${gameStore.totalTreasures} 件寶物！\n\n探索進度：${gameStore.visitedCount}/${gameStore.GRID * gameStore.GRID} (${Math.round(gameStore.visitedCount / (gameStore.GRID * gameStore.GRID) * 100)}%)\n回合：${gameStore.turnCount}\n金錢：${gameStore.formatMoney(gameStore.money)}`,
              effect: { money: 0 },
              emoji: '🏆',
            }
            gameStore.showEventModal = true
            return
          }
          // Show treasure modal
          gameStore.currentEvent = {
            type: 'treasure',
            title: `💎 發現寶物！(${gameStore.treasuresFound}/${gameStore.totalTreasures})`,
            description: `你喺呢度發現咗一件遠古寶物！\n獲得 $200 獎金！`,
            effect: { money: 0 },  // Already added in collectTreasure
            emoji: '💎',
          }
          gameStore.showEventModal = true
        } else {
          // Normal event
          this.triggerTileEvent(nx, ny)
        }
      }
    })
  }

  /* ═══════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════ */
  triggerTileEvent(x, y) {
    const cell = gameStore.grid[y][x]
    const biome = cell.biome

    // 20% chance of generic event, 80% biome-specific
    const pool = Math.random() < 0.2 ? GENERIC_EVENTS : (EVENTS[biome] || GENERIC_EVENTS)
    const ev = pool[Math.floor(Math.random() * pool.length)]

    soundManager.play('event')

    gameStore.currentEvent = {
      type: 'event',
      title: ev.title,
      description: ev.desc,
      effect: { money: ev.money },
      emoji: ev.emoji,
    }
    gameStore.showEventModal = true
  }

  /* ═══════════════════════════════════════════
     STAGE 2: Property / Investment Shop
     ═══════════════════════════════════════════ */
  openPropertyShop() {
    if (gameStore.showEventModal) return
    const cell = gameStore.grid[gameStore.playerPos.y][gameStore.playerPos.x]
    const biome = cell.biome

    if (biome !== 'tile-village' && biome !== 'tile-market') {
      gameStore.currentEvent = {
        type: 'event',
        title: '呢度買唔到地',
        description: '要去村莊或者市集先可以買地投資㗎！',
        effect: { money: 0 },
        emoji: '🤷',
      }
      gameStore.showEventModal = true
      return
    }

    const available = PROPERTY_TYPES.map(p => ({
      ...p,
      affordable: gameStore.money >= p.cost,
    }))

    const list = available.map(p =>
      `${p.affordable ? '✅' : '❌'} ${p.icon} ${p.name} — $${p.cost}（回合收入 $${p.income}）`
    ).join('\n')

    gameStore.currentEvent = {
      type: 'shop',
      title: '🏪 投資商店',
      description: `你可以喺度投資：\n\n${list}\n\n㩒「確定」關閉，㩒骰子掣購買。`,
      effect: { money: 0 },
      emoji: '💼',
      shopItems: available,
    }
    gameStore.showEventModal = true
    this.showPropertyShop = true
  }

  buyProperty(typeId) {
    const p = PROPERTY_TYPES.find(x => x.id === typeId)
    if (!p) return false
    if (gameStore.money < p.cost) return false

    gameStore.addMoney(-p.cost)
    gameStore.ownedProperties.push({
      ...p,
      x: gameStore.playerPos.x,
      y: gameStore.playerPos.y,
      level: 1,
    })
    return true
  }

  handleBuyProperty(typeId) {
    const ok = this.buyProperty(typeId)
    if (ok) {
      gameStore.currentEvent = {
        type: 'event',
        title: '✅ 買咗啦！',
        description: `你成功買咗 ${PROPERTY_TYPES.find(p => p.id === typeId)?.name}！\n每回合收入 +$${PROPERTY_TYPES.find(p => p.id === typeId)?.income}！`,
        effect: { money: 0 },
        emoji: '🏪',
      }
    } else {
      gameStore.currentEvent = {
        type: 'event',
        title: '❌ 唔夠錢',
        description: '你唔夠錢買呢項投資⋯⋯',
        effect: { money: 0 },
        emoji: '😅',
      }
    }
    gameStore.showEventModal = true
  }

  collectPropertyIncome() {
    let total = 0
    gameStore.ownedProperties.forEach(p => {
      total += p.income * p.level
    })
    if (total > 0) {
      gameStore.addMoney(total)
    }
    return total
  }

  /* ═══════════════════════════════════════════
     STAGE 3: Dice action (search / gamble)
     ═══════════════════════════════════════════ */
  onDiceAction() {
    if (gameStore.isAnimating || gameStore.showEventModal) return

    const roll = Phaser.Math.Between(1, 6)
    const bonus = Math.floor(roll * 10)

    gameStore.currentEvent = {
      type: 'event',
      title: `🎲 探索擲骰 — ${roll}點`,
      description: `你喺呢度仔細搜索，結果發現咗價值 $${bonus} 嘅物品！`,
      effect: { money: bonus },
      emoji: '🎲',
    }
    gameStore.showEventModal = true
  }

  /* ═══════════════════════════════════════════
     SCENE UI
     ═══════════════════════════════════════════ */
  createSceneUI() {
    this.exploreText = this.add.text(4, 4, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(20)

    this.statusText = this.add.text(W - 4, 4, '', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aacc',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20)
  }

  syncHUD() {
    const v = gameStore.visitedCount
    const total = gameStore.GRID * gameStore.GRID
    const pct = Math.round(v / total * 100)
    if (this.exploreText) {
      this.exploreText.setText(`🗺️ ${v}/${total} (${pct}%)`)
    }
    if (this.statusText) {
      const props = gameStore.ownedProperties.length
      const tFound = gameStore.treasuresFound
      this.statusText.setText(`💰 ${gameStore.formatMoney(gameStore.money)}  🏠 ${props}  🏆${tFound}/5  T${gameStore.turnCount}`)
    }
  }

  /* ═══════════════════════════════════════════
     COMMUNICATION
     ═══════════════════════════════════════════ */
  listen() {
    this.cleanup = [
      onGameEvent('game:roll-dice',    () => this.onDiceAction()),
      onGameEvent('game:close-event',  () => this.onEventClose()),
      onGameEvent('game:open-shop',    () => this.openPropertyShop()),
      onGameEvent('game:buy-property', (d) => this.handleBuyProperty(d.typeId)),
    ]
    this.events.on('shutdown', () => this.cleanup.forEach(f => f()))
  }

  onEventClose() {
    const income = this.collectPropertyIncome()
    if (income > 0) {
      // Silently added
    }

    gameStore.showEventModal = false
    gameStore.resetTurn()
    this.syncHUD()
    // Auto-save after each turn
    gameStore.saveProgress()
  }
}
