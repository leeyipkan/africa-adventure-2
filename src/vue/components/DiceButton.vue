<template>
  <div class="absolute bottom-5 right-5 z-30 pointer-events-auto">
    <button
      @click="roll"
      :disabled="store.showEventModal"
      class="group relative w-[72px] h-[72px] rounded-2xl
             bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500
             border-[3px] border-yellow-600/80
             shadow-[0_5px_0_#b45309,0_8px_16px_rgba(0,0,0,0.5)]
             active:translate-y-[3px] active:shadow-[0_2px_0_#b45309,0_3px_6px_rgba(0,0,0,0.5)]
             transition-all duration-75
             disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-[0_2px_0_#b45309]
             disabled:translate-y-[3px]
             flex items-center justify-center"
      aria-label="探索"
    >
      <span class="absolute inset-[-4px] rounded-[18px] border-2 border-yellow-300/30
                   group-hover:border-yellow-300/60 transition-all duration-200" />
      <span class="text-[34px] drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]">🔍</span>
    </button>
    <div class="text-center mt-1 text-[9px] text-gray-500 font-bold tracking-wider pointer-events-none select-none">
      探索
    </div>
  </div>
</template>

<script setup>
import { gameStore } from '../../stores/gameStore.js'
import { dispatchGameEvent } from '../../phaser/events.js'
const store = gameStore
function roll() {
  if (!store.showEventModal) dispatchGameEvent('game:roll-dice')
}
</script>
