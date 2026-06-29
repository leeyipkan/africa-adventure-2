<template>
  <div class="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-2 px-3 pointer-events-none">
    <!-- Money -->
    <div class="bg-black/70 px-2.5 py-1.5 rounded-lg border-2 border-yellow-500/60 shadow-lg">
      <span class="text-yellow-400 text-sm font-pixel tracking-tight">
        💰 {{ store.formatMoney(store.currentPlayer.money) }}
      </span>
    </div>
    <!-- Turn + status -->
    <div class="flex items-center gap-2">
      <div
        v-if="!store.canRoll"
        class="bg-yellow-500/20 px-2 py-1 rounded-lg border border-yellow-500/40"
      >
        <span class="text-yellow-300 text-[9px] font-pixel">🎲 進行中</span>
      </div>
      <div class="bg-black/70 px-2.5 py-1.5 rounded-lg border-2 border-blue-500/60 shadow-lg">
        <span class="text-blue-300 text-[10px] font-pixel">T{{ store.turnCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { gameStore } from '../../stores/gameStore.js'
const store = gameStore
</script>
