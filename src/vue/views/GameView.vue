<template>
  <div ref="root" class="relative w-full h-full overflow-hidden bg-[#0a0a1a] select-none">
    <div ref="phaserMount" class="absolute inset-0" />
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
import GameHUD from '../components/GameHUD.vue'
import DiceButton from '../components/DiceButton.vue'
import ModalEvent from '../components/ModalEvent.vue'

const root = ref(null)
const phaserMount = ref(null)
let game = null

async function lockLandscape() {
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('landscape')
  } catch (_) {}
}
lockLandscape()

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    parent: phaserMount.value,
    width: 960,
    height: 640,
    backgroundColor: '#0a0a1a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, BoardScene],
  }
  game = new Phaser.Game(config)
  window.__PHASER_GAME__ = game
})

onUnmounted(() => {
  if (game) { game.destroy(true); game = null }
})
</script>
