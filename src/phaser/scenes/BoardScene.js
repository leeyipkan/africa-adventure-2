import Phaser from 'phaser'
import { PHASER_EVENTS, dispatchGameEvent, onGameEvent } from '../events.js'
import { gameStore } from '../../stores/gameStore.js'

// ── Constants ──
const W = 800
const H = 500
const TILE_SIZE = 100

// 4 cells in a square loop — top-left corner positions
const TILE_POS = [
  { x: W / 2 - TILE_SIZE - 12, y: H / 2 - TILE_SIZE - 12 },  // 0: top-left
  { x: W / 2 + 12,              y: H / 2 - TILE_SIZE - 12 },  // 1: top-right
  { x: W / 2 + 12,              y: H / 2 + 12 },              // 2: bottom-right
  { x: W / 2 - TILE_SIZE - 12,  y: H / 2 + 12 },              // 3: bottom-left
]

// Tile centres (where player stands)
const TILE_CENTER = TILE_POS.map(p => ({
  x: p.x + TILE_SIZE / 2,
  y: p.y + TILE_SIZE / 2,
}))

const TILE_CFG = [
  { type: 'start', label: '起點', fill: 0x4caf50, light: 0x66bb6a, dark: 0x2e7d32, icon: '🏠' },
  { type: 'event', label: '事件', fill: 0x2196f3, light: 0x42a5f5, dark: 0x1565c0, icon: '❓' },
  { type: 'shop',  label: '市集', fill: 0xff9800, light: 0xffb74d, dark: 0xe65100, icon: '🏪' },
  { type: 'event', label: '事件', fill: 0x2196f3, light: 0x42a5f5, dark: 0x1565c0, icon: '❗' },
]

export class BoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BoardScene' })
    this.playerContainer = null
    this.cleanupFns = []
    this.diceText = null
    this.moneyText = null
  }

  /* ================================================================
   *  CREATE
   * ================================================================ */
  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.drawBg()
    this.drawBoard()
    this.createPlayer()
    this.createUI()
    this.listen()

    // initial HUD
    this.syncMoney()
  }

  /* ================================================================
   *  BACKGROUND
   * ================================================================ */
  drawBg() {
    const g = this.add.graphics()
    // Night sky
    g.fillStyle(0x0f0f23)
    g.fillRect(0, 0, W, H)

    // Stars
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, W)
      const sy = Phaser.Math.Between(0, H)
      const sz = Phaser.Math.FloatBetween(0.3, 1.2)
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7)
      g.fillStyle(0xffffff, alpha)
      g.fillCircle(sx, sy, sz)
    }

    // ground circle
    g.fillStyle(0x1a1a2e, 0.6)
    g.fillCircle(W / 2, H / 2, 160)
    g.lineStyle(2, 0x2a2a4e, 0.4)
    g.strokeCircle(W / 2, H / 2, 160)
  }

  /* ================================================================
   *  BOARD TILES (pixel-art style)
   * ================================================================ */
  drawBoard() {
    TILE_POS.forEach((pos, i) => {
      const cfg = TILE_CFG[i]
      const g = this.add.graphics()

      // Shadow
      g.fillStyle(0x000000, 0.35)
      g.fillRect(pos.x + 3, pos.y + 3, TILE_SIZE, TILE_SIZE)

      // Main fill
      g.fillStyle(cfg.fill)
      g.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE)

      // Pixel highlight (top + left)
      g.fillStyle(cfg.light)
      g.fillRect(pos.x, pos.y, TILE_SIZE, 3)
      g.fillRect(pos.x, pos.y, 3, TILE_SIZE)

      // Pixel shadow (bottom + right)
      g.fillStyle(cfg.dark)
      g.fillRect(pos.x, pos.y + TILE_SIZE - 3, TILE_SIZE, 3)
      g.fillRect(pos.x + TILE_SIZE - 3, pos.y, 3, TILE_SIZE)

      // Cross-hatch
      g.lineStyle(1, cfg.dark, 0.12)
      g.lineBetween(pos.x + 12, pos.y + TILE_SIZE / 2, pos.x + TILE_SIZE - 12, pos.y + TILE_SIZE / 2)
      g.lineBetween(pos.x + TILE_SIZE / 2, pos.y + 12, pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE - 12)

      // Icon
      this.add.text(pos.x + TILE_SIZE / 2, pos.y + 22, cfg.icon, {
        fontSize: '28px',
      }).setOrigin(0.5)

      // Label
      const labelColor = i === 0 ? '#1b5e20' : i === 2 ? '#4e2500' : '#0d47a1'
      this.add.text(pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE - 12, cfg.label, {
        fontSize: '11px',
        fontFamily: '"Press Start 2P", monospace, sans-serif',
        color: labelColor,
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5)
    })

    // Direction arrows between tiles
    const arrows = [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ]
    arrows.forEach(([a, b]) => {
      const g = this.add.graphics()
      const from = TILE_CENTER[a]
      const to = TILE_CENTER[b]
      g.lineStyle(2, 0xccccff, 0.25)
      g.lineBetween(from.x, from.y, to.x, to.y)
      // Arrowhead
      const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y)
      const tipX = (from.x + to.x) / 2
      const tipY = (from.y + to.y) / 2
      g.fillStyle(0xccccff, 0.25)
      g.fillTriangle(
        tipX, tipY,
        tipX - 6 * Math.cos(angle - 0.5), tipY - 6 * Math.sin(angle - 0.5),
        tipX - 6 * Math.cos(angle + 0.5), tipY - 6 * Math.sin(angle + 0.5),
      )
    })
  }

  /* ================================================================
   *  PLAYER (pixel-art character drawn in a container)
   * ================================================================ */
  createPlayer() {
    const start = TILE_CENTER[gameStore.currentPlayer.position]
    this.playerContainer = this.add.container(start.x, start.y)

    const g = this.add.graphics()
    // Body (cyan)
    g.fillStyle(0x4fc3f7)
    g.fillRect(-10, -12, 20, 18)
    // Highlight
    g.fillStyle(0x81d4fa)
    g.fillRect(-8, -10, 16, 2)

    // Head
    g.fillStyle(0x81d4fa)
    g.fillRect(-8, -20, 16, 10)

    // Eyes (white)
    g.fillStyle(0xffffff)
    g.fillRect(-5, -18, 3, 3)
    g.fillRect(2, -18, 3, 3)
    // Pupils
    g.fillStyle(0x000000)
    g.fillRect(-4, -17, 2, 2)
    g.fillRect(3, -17, 2, 2)

    // Mouth (smile)
    g.fillStyle(0x000000)
    g.fillRect(-3, -13, 6, 1)

    // Legs
    g.fillStyle(0x29b6f6)
    g.fillRect(-7, 6, 5, 6)
    g.fillRect(2, 6, 5, 6)

    // Shoes
    g.fillStyle(0x795548)
    g.fillRect(-8, 10, 7, 3)
    g.fillRect(1, 10, 7, 3)

    this.playerContainer.add(g)
  }

  /* ================================================================
   *  SCENE UI (title, money display, dice result)
   * ================================================================ */
  createUI() {
    // Title
    this.add.text(W / 2, 24, '🌍 非洲探險 2', {
      fontSize: '16px',
      fontFamily: '"Press Start 2P", monospace, sans-serif',
      color: '#e2b714',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Dice result
    this.diceText = this.add.text(W / 2, 70, '', {
      fontSize: '42px',
      fontFamily: '"Press Start 2P", monospace, sans-serif',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false).setDepth(10)

    // Money display (left)
    this.moneyText = this.add.text(20, 8, '', {
      fontSize: '14px',
      fontFamily: '"Press Start 2P", monospace, sans-serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
    })

    // Turn counter (right)
    this.turnText = this.add.text(W - 20, 8, '', {
      fontSize: '11px',
      fontFamily: '"Press Start 2P", monospace, sans-serif',
      color: '#aaaacc',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(1, 0)

    // Instruction text (centered at bottom of canvas)
    this.helpText = this.add.text(W / 2, H - 20, '撳右下角 🎲 掣擲骰', {
      fontSize: '10px',
      fontFamily: '"Press Start 2P", monospace, sans-serif',
      color: '#666688',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)
  }

  syncMoney() {
    const p = gameStore.currentPlayer
    if (this.moneyText) {
      this.moneyText.setText(`💰 ${gameStore.formatMoney(p.money)}`)
    }
    if (this.turnText) {
      this.turnText.setText(`${gameStore.turnCount}`)
    }
  }

  /* ================================================================
   *  EVENT LISTENERS (Phaser ↔ Vue bridge via CustomEvent)
   * ================================================================ */
  listen() {
    const c1 = onGameEvent(PHASER_EVENTS.ROLL_DICE, () => this.onRollDice())
    const c2 = onGameEvent(PHASER_EVENTS.CLOSE_EVENT, () => this.onEventClosed())
    this.cleanupFns = [c1, c2]

    this.events.on('shutdown', () => {
      this.cleanupFns.forEach(fn => fn())
      this.cleanupFns = []
    })
  }

  /* ================================================================
   *  DICE ROLL
   * ================================================================ */
  onRollDice() {
    if (!gameStore.canRoll || gameStore.isAnimating) return

    gameStore.canRoll = false
    gameStore.isAnimating = true
    gameStore.showDice = true

    const steps = Phaser.Math.Between(1, 3)
    dispatchGameEvent(PHASER_EVENTS.DICE_START, { steps })

    // Animate cycling numbers
    this.animateDice(steps)
  }

  animateDice(finalSteps) {
    this.diceText.setVisible(true)
    let frame = 0
    const totalFrames = 12

    const timer = this.time.addEvent({
      delay: 70,
      repeat: totalFrames - 1,
      callback: () => {
        frame++
        const val = frame < totalFrames ? Phaser.Math.Between(1, 6) : finalSteps
        this.diceText.setText(val.toString())
        // Bounce scale
        this.diceText.setScale(1 + (Math.random() * 0.08))
      },
    })

    this.time.delayedCall(70 * totalFrames + 80, () => {
      this.diceText.setVisible(false)
      dispatchGameEvent(PHASER_EVENTS.DICE_END, { steps: finalSteps })
      this.movePlayer(finalSteps)
    })
  }

  /* ================================================================
   *  PLAYER MOVEMENT (step-by-step tweens)
   * ================================================================ */
  movePlayer(steps) {
    const startPos = gameStore.currentPlayer.position

    for (let i = 1; i <= steps; i++) {
      const nextPos = (startPos + i) % 4
      const target = TILE_CENTER[nextPos]
      const delay = (i - 1) * 350

      this.tweens.add({
        targets: this.playerContainer,
        x: target.x,
        y: target.y,
        duration: 280,
        delay,
        ease: 'Sine.easeInOut',
        onStart: () => {
          // Squash effect on each step
          this.tweens.add({
            targets: this.playerContainer,
            scaleY: 0.7,
            duration: 70,
            yoyo: true,
            ease: 'Bounce.easeOut',
          })
        },
      })
    }

    // After all steps trigger the landed event
    this.time.delayedCall(steps * 350 + 120, () => {
      gameStore.movePlayer(steps)
      this.syncMoney()

      const cellCfg = TILE_CFG[gameStore.currentCellIndex]
      dispatchGameEvent(PHASER_EVENTS.PLAYER_LANDED, {
        cellIndex: gameStore.currentCellIndex,
        cellType: cellCfg.type,
        cellLabel: cellCfg.label,
      })
    })
  }

  /* ================================================================
   *  EVENT CLOSED (modal dismissed by user)
   * ================================================================ */
  onEventClosed() {
    gameStore.showEventModal = false
    gameStore.resetTurn()
    this.syncMoney()
    this.helpText.setText('撳右下角 🎲 掣擲骰')
  }
}
