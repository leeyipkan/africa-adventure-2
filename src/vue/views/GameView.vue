<template>
  <div ref="root" class="relative w-full h-full overflow-hidden bg-[#0a0a1a] select-none">
    <!-- Phaser canvas is injected into #phaser-mount -->
    <div ref="phaserMount" class="absolute inset-0" />

    <!-- Vue overlay on top of canvas -->
    <GameHUD />
    <DiceButton />
    <ModalEvent />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { BootScene } from '../../phaser/scenes/BootScene.js'
import { BoardScene } from '../../phaser/scenes/BoardScene.js'
import { gameStore } from '../../stores/gameStore.js'
import { onGameEvent, PHASER_EVENTS } from '../../phaser/events.js'
import eventsData from '../../data/events.json'

import GameHUD from '../components/GameHUD.vue'
import DiceButton from '../components/DiceButton.vue'
import ModalEvent from '../components/ModalEvent.vue'

const root = ref(null)
const phaserMount = ref(null)
let game = null
const cleanups = []
const visited = new Set()

// ── Landscape lock ──
async function lockLandscape() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape')
    }
  } catch (_) { /* not supported or denied */ }
}
lockLandscape()

// ── Handle player landed → show event via Vue ──
function handlePlayerLanded(data) {
  const idx = data.cellIndex
  visited.add(idx)
  const cellType = data.cellType

  if (cellType === 'event' || cellType === 'start') {
    showEvent(eventsData[Math.floor(Math.random() * eventsData.length)])
  } else if (cellType === 'shop') {
    showEvent({
      id: 99,
      type: 'shop',
      title: '歡迎嚟到市集 🏪',
      description: '呢度好熱鬧！有好多非洲特色手工藝品。\n今次你淨係行咗個圈，冇買到嘢。',
      effect: { money: 0 },
      emoji: '🏪',
    })
  } else {
    showEvent({
      id: 0,
      type: 'neutral',
      title: '繼續前進',
      description: '你行到一個新嘅地方。周圍望吓先。',
      effect: { money: 0 },
      emoji: '🚶',
    })
  }
}

function showEvent(event) {
  gameStore.currentEvent = event
  gameStore.showEventModal = true
}

// ── Bootstrap ──
onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    parent: phaserMount.value,
    width: 800,
    height: 500,
    backgroundColor: '#0a0a1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, BoardScene],
  }
  game = new Phaser.Game(config)

  // Listen for player landed event
  const cl = onGameEvent(PHASER_EVENTS.PLAYER_LANDED, handlePlayerLanded)
  cleanups.push(cl)
})

onUnmounted(() => {
  cleanups.forEach(fn => fn())
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>
