<template>
  <div class="absolute bottom-5 right-5 z-30 pointer-events-auto">
    <button
      @click="roll"
      :disabled="!store.canRoll"
      class="w-[72px] h-[72px] rounded-xl
             bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500
             border-[3px] border-yellow-600
             shadow-[0_4px_0_#c2410c,0_6px_12px_rgba(0,0,0,0.5)]
             active:translate-y-1 active:shadow-[0_2px_0_#c2410c,0_3px_6px_rgba(0,0,0,0.5)]
             transition-all duration-75
             disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-[0_2px_0_#c2410c]
             disabled:translate-y-1
             flex items-center justify-center"
      aria-label="擲骰"
    >
      <span class="text-[36px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">🎲</span>
    </button>
  </div>
</template>

<script setup>
import { gameStore } from '../../stores/gameStore.js'
import { dispatchGameEvent, PHASER_EVENTS } from '../../phaser/events.js'
const store = gameStore

function roll() {
  if (!gameStore.canRoll) return
  dispatchGameEvent(PHASER_EVENTS.ROLL_DICE)
}
</script>
