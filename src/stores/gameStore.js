import { reactive } from 'vue'

export const gameStore = reactive({
  // ── Player ──
  currentPlayerIndex: 0,
  players: [
    { name: '你', money: 1000, position: 0, color: 0x4fc3f7, colorHex: '#4fc3f7' },
  ],

  // ── Board ──
  currentCellIndex: 0,
  totalCells: 4,

  // ── Game phase flags ──
  isAnimating: false,
  canRoll: true,
  soundEnabled: true,

  // ── Event modal ──
  showEventModal: false,
  currentEvent: null,

  // ── Dice ──
  diceResult: null,
  showDice: false,

  // ── Stats ──
  turnCount: 0,

  // ── Computed-like helpers ──
  get currentPlayer() {
    return this.players[this.currentPlayerIndex]
  },

  formatMoney(amount) {
    return '$' + Number(amount).toLocaleString()
  },

  addMoney(amount) {
    this.currentPlayer.money += amount
  },

  movePlayer(steps) {
    const newPos = (this.currentPlayer.position + steps) % this.totalCells
    this.currentPlayer.position = newPos
    this.currentCellIndex = newPos
    return newPos
  },

  resetTurn() {
    this.turnCount++
    this.canRoll = true
    this.showDice = false
    this.showEventModal = false
    this.currentEvent = null
    this.diceResult = null
    this.isAnimating = false
  },
})
