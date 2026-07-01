<template>
  <div class="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-2 px-3 pointer-events-none">
    <!-- Left: Exploration + Treasure progress -->
    <div class="flex flex-col gap-1">
      <!-- Exploration progress -->
      <div
        class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
               px-3 py-2 rounded-xl border-2 border-green-500/40 shadow-lg"
      >
        <div class="text-[9px] text-gray-400 font-semibold tracking-wider -mt-0.5">探索進度</div>
        <div class="text-green-300 text-base font-bold">
          🗺️ {{ store.visitedCount }}<span class="text-gray-500 text-sm">/{{ store.GRID * store.GRID }}</span>
        </div>
      </div>

      <!-- Treasure counter -->
      <div
        v-if="!store.gameWon"
        class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
               px-3 py-2 rounded-xl border-2 border-amber-500/50 shadow-lg"
      >
        <div class="text-[9px] text-gray-400 font-semibold tracking-wider -mt-0.5">🏆 寶物</div>
        <div class="text-amber-300 text-base font-bold text-center">
          {{ store.treasuresFound }}/{{ store.totalTreasures }}
        </div>
      </div>

      <!-- Compass hint -->
      <div
        v-if="store.nearestTreasureDir && !store.gameWon"
        class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
               px-3 py-1.5 rounded-xl border-2 border-cyan-500/40 shadow-lg"
      >
        <div class="text-cyan-300 text-xs font-bold flex items-center gap-1">
          <span>🧭</span>
          <span>{{ store.nearestTreasureDir }} {{ store.nearestTreasureDist }}格</span>
        </div>
      </div>
    </div>

    <!-- Right: Money + Turn + Mute -->
    <div class="flex flex-col items-end gap-1">
      <div class="flex items-start gap-1.5">
        <!-- Money -->
        <div
          class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
                 px-2.5 py-2 rounded-xl border-2 border-yellow-500/50 shadow-lg"
        >
          <div class="text-[9px] text-gray-400 font-semibold tracking-wider text-center -mt-0.5">金錢</div>
          <div class="text-yellow-300 text-base font-bold text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            💰 {{ store.formatMoney(store.money) }}
          </div>
        </div>
        <!-- Turn -->
        <div
          class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
                 px-2.5 py-2 rounded-xl border-2 border-blue-500/40 shadow-lg"
        >
          <div class="text-[9px] text-gray-400 font-semibold tracking-wider text-center -mt-0.5">回合</div>
          <div class="text-blue-300 text-base font-bold text-center">{{ store.turnCount }}</div>
        </div>
        <!-- Properties -->
        <div
          v-if="store.ownedProperties.length"
          class="bg-gradient-to-b from-black/75 to-black/85 backdrop-blur-sm
                 px-2.5 py-2 rounded-xl border-2 border-amber-500/40 shadow-lg"
        >
          <div class="text-[9px] text-gray-400 font-semibold tracking-wider text-center -mt-0.5">投資</div>
          <div class="text-amber-300 text-base font-bold text-center">{{ store.ownedProperties.length }}</div>
        </div>
      </div>

      <!-- Mute toggle -->
      <button
        @click="toggleSound"
        class="pointer-events-auto w-9 h-9 rounded-full
               bg-black/60 backdrop-blur-sm border border-gray-600/50
               flex items-center justify-center
               active:scale-90 transition-all duration-75"
        :aria-label="isMuted ? '取消靜音' : '靜音'"
      >
        <span class="text-base">{{ isMuted ? '🔇' : '🔊' }}</span>
      </button>

      <!-- Shop button -->
      <button
        @click="openShop"
        class="pointer-events-auto w-9 h-9 rounded-full
               bg-black/60 backdrop-blur-sm border border-emerald-600/50
               flex items-center justify-center
               active:scale-90 transition-all duration-75"
        aria-label="投資商店"
      >
        <span class="text-base">🏪</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { gameStore } from '../../stores/gameStore.js'
import { soundManager } from '../../phaser/SoundManager.js'
import { dispatchGameEvent } from '../../phaser/events.js'

const store = gameStore
const isMuted = ref(false)

function toggleSound() {
  isMuted.value = soundManager.toggleMute()
}

function openShop() {
  dispatchGameEvent('game:open-shop')
}
</script>
