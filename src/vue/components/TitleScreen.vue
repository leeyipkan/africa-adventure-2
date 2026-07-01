<template>
  <div class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0a1a] select-none overflow-hidden">
    <!-- Star background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        v-for="n in 60" :key="n"
        class="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
        :style="{
          left: `${(n * 17) % 100}%`,
          top: `${(n * 13) % 100}%`,
          width: `${1 + (n % 3)}px`,
          height: `${1 + (n % 3)}px`,
          animationDelay: `${n * 0.15}s`,
          opacity: 0.3 + (n % 5) * 0.14,
        }"
      />
    </div>

    <!-- Title area -->
    <div class="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-sm">
      <!-- Globe icon -->
      <div class="w-24 h-24 rounded-full bg-gradient-to-b from-amber-500/30 to-orange-500/10
                  border-[3px] border-amber-400/40 flex items-center justify-center
                  shadow-[0_0_40px_rgba(251,191,36,0.2)]">
        <span class="text-5xl animate-float">🌍</span>
      </div>

      <!-- Title -->
      <div class="text-center">
        <h1
          class="text-3xl font-bold text-yellow-400 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]
                 tracking-wide"
          style="font-family: 'Press Start 2P', monospace; font-size: 22px; line-height: 1.4;"
        >
          非洲探險 2
        </h1>
        <p class="text-gray-500 text-xs mt-2 tracking-widest" style="font-family: 'Press Start 2P', monospace;">
          收集 5 件寶物！
        </p>
      </div>

      <!-- Name input -->
      <div class="w-full">
        <label class="block text-[10px] text-gray-400 mb-1.5 font-semibold tracking-wider text-center">
          探險家名稱
        </label>
        <input
          v-model="playerName"
          maxlength="10"
          class="w-full px-4 py-3 rounded-xl text-center text-base font-bold
                 bg-gray-900/80 border-2 border-yellow-500/50 text-yellow-200
                 placeholder-gray-600 focus:border-yellow-400 focus:outline-none
                 transition-all duration-200"
          placeholder="探險家"
          @keyup.enter="startNewGame"
        />
      </div>

      <!-- Buttons -->
      <div class="w-full flex flex-col gap-3 mt-2">
        <!-- New game -->
        <button
          @click="startNewGame"
          class="w-full py-3.5 rounded-xl text-base font-bold tracking-wider
                 bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_4px_0_#b45309] active:shadow-[0_1px_0_#b45309] active:translate-y-[3px]"
        >
          🚀 開始探險
        </button>

        <!-- Continue (if save exists) -->
        <button
          v-if="hasSave"
          @click="continueGame"
          class="w-full py-3 rounded-xl text-sm font-bold tracking-wider
                 bg-gradient-to-r from-blue-500 to-cyan-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_3px_0_#0369a1] active:shadow-[0_1px_0_#0369a1] active:translate-y-[2px]"
        >
          💾 繼續探險（💰${{ saveData?.money || '?' }} · 🏆{{ saveData?.treasuresFound || 0 }}/5）
        </button>
      </div>

      <!-- Footer -->
      <p class="text-gray-600 text-[10px] mt-4 text-center leading-relaxed">
        🌴 用 pixel art 探索非洲大陸<br>
        收集寶物，成為最叻嘅探險家！
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gameStore } from '../../stores/gameStore.js'

const emit = defineEmits(['start'])

const playerName = ref('')
const hasSave = ref(false)
const saveData = ref(null)

onMounted(() => {
  const saved = gameStore.loadProgress()
  if (saved) {
    hasSave.value = true
    saveData.value = saved
    playerName.value = saved.name || ''
  }
})

function startNewGame() {
  gameStore.name = playerName.value || '探險家'
  gameStore.clearProgress()
  emit('start')
}

function continueGame() {
  const saved = gameStore.loadProgress()
  if (!saved) return
  gameStore.restoreFromSave(saved)
  emit('start')
}
</script>

<style scoped>
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-twinkle {
  animation: twinkle 3s ease-in-out infinite;
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
