<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="dismiss"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="dismiss" />

      <!-- Win Modal -->
      <div
        v-if="isWin"
        class="relative w-full max-w-md
               bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
               border-[4px] border-yellow-400/90 rounded-2xl
               shadow-[0_0_60px_rgba(234,179,8,0.3)]
               p-8 pt-6 text-center overflow-hidden"
      >
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400" />
        <div class="mx-auto w-20 h-20 rounded-full
                    bg-gradient-to-b from-yellow-500/30 to-orange-500/20
                    border-3 border-yellow-400/40
                    flex items-center justify-center mb-4 animate-bounce"
        >
          <span class="text-5xl">🏆</span>
        </div>
        <h2 class="text-xl font-bold text-yellow-400 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          🎉 恭喜曬！你贏咗！🎉
        </h2>
        <p class="text-gray-300 text-sm leading-relaxed mb-2 whitespace-pre-line">
          你成功收集晒全部 {{ store.totalTreasures }} 件寶物！
        </p>
        <div class="grid grid-cols-3 gap-2 mb-6 mt-4">
          <div class="bg-black/40 rounded-xl p-2 border border-gray-700/50">
            <div class="text-[9px] text-gray-500">探索</div>
            <div class="text-green-400 text-base font-bold">{{ store.visitedCount }}/400</div>
            <div class="text-[10px] text-gray-500">{{ Math.round(store.visitedCount/4) }}%</div>
          </div>
          <div class="bg-black/40 rounded-xl p-2 border border-gray-700/50">
            <div class="text-[9px] text-gray-500">回合</div>
            <div class="text-blue-400 text-base font-bold">{{ store.turnCount }}</div>
          </div>
          <div class="bg-black/40 rounded-xl p-2 border border-gray-700/50">
            <div class="text-[9px] text-gray-500">金錢</div>
            <div class="text-yellow-400 text-base font-bold">{{ store.formatMoney(store.money) }}</div>
          </div>
        </div>
        <button
          @click="restart"
          class="w-full py-3.5 rounded-xl text-base font-bold
                 bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_4px_0_#b45309] active:shadow-[0_1px_0_#b45309] active:translate-y-[3px]"
        >🔄 再玩一次</button>
      </div>

      <!-- Treasure Modal -->
      <div
        v-else-if="isTreasure"
        class="relative w-full max-w-sm
               bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
               border-[3px] border-amber-400/90 rounded-2xl
               shadow-[0_0_40px_rgba(245,158,11,0.25)]
               p-6 pt-5 text-center overflow-hidden"
      >
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
        <div class="mx-auto w-16 h-16 rounded-full
                    bg-gradient-to-b from-amber-500/30 to-yellow-500/20
                    border-2 border-amber-400/40
                    flex items-center justify-center mb-3"
        >
          <span class="text-3xl animate-pulse">💎</span>
        </div>
        <h2 class="text-base font-bold text-amber-400 mb-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {{ ev.title }}
        </h2>
        <p class="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
          {{ ev.description }}
        </p>
        <div class="mb-4">
          <span class="inline-block bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-500/30">
            +$200 💰
          </span>
        </div>
        <button
          @click="dismiss"
          class="w-full py-3 rounded-xl text-sm font-bold
                 bg-gradient-to-r from-amber-500 to-yellow-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_3px_0_#b45309] active:shadow-[0_1px_0_#b45309] active:translate-y-[2px]"
        >繼 續</button>
      </div>

      <!-- Shop Modal (Property Investment) -->
      <div
        v-else-if="isShop"
        class="relative w-full max-w-sm
               bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
               border-[3px] border-emerald-400/80 rounded-2xl
               shadow-[0_0_40px_rgba(52,211,153,0.2)]
               p-6 pt-5 text-center overflow-hidden"
      >
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500" />
        <div class="mx-auto w-16 h-16 rounded-full
                    bg-gradient-to-b from-emerald-500/20 to-green-500/10
                    border-2 border-emerald-500/30
                    flex items-center justify-center mb-3"
        >
          <span class="text-3xl">🏪</span>
        </div>
        <h2 class="text-base font-bold text-emerald-400 mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          投資商店
        </h2>
        <p class="text-[10px] text-gray-500 mb-3">喺到買投資項目，每回合自動賺收入！</p>

        <div class="flex flex-col gap-2 mb-4">
          <div
            v-for="item in shopItems"
            :key="item.id"
            class="flex items-center gap-2 bg-black/40 rounded-xl p-2.5 border"
            :class="item.affordable ? 'border-emerald-700/50' : 'border-gray-700/40 opacity-50'"
          >
            <span class="text-2xl">{{ item.icon }}</span>
            <div class="flex-1 text-left min-w-0">
              <div class="text-sm font-bold text-white truncate">{{ item.name }}</div>
              <div class="text-[10px] text-gray-400 truncate">{{ item.desc }}</div>
              <div class="text-[10px] text-emerald-400">回合收入 +${{ item.income }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xs text-yellow-400 font-bold">${{ item.cost }}</div>
              <button
                v-if="item.affordable"
                @click="buyItem(item.id)"
                class="mt-1 px-3 py-1 rounded-lg text-[10px] font-bold
                       bg-emerald-500 text-black active:scale-95 transition-all"
              >買</button>
              <div v-else class="mt-1 text-[10px] text-red-400 font-bold">唔夠錢</div>
            </div>
          </div>
        </div>

        <button
          @click="dismiss"
          class="w-full py-3 rounded-xl text-sm font-bold
                 bg-gradient-to-r from-emerald-500 to-green-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_3px_0_#047857] active:shadow-[0_1px_0_#047857] active:translate-y-[2px]"
        >關 閉</button>
      </div>

      <!-- Normal event modal -->
      <div
        v-else
        class="relative w-full max-w-sm
               bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950
               border-[3px] border-yellow-500/80 rounded-2xl
               shadow-[0_0_40px_rgba(234,179,8,0.15)]
               p-6 pt-5 text-center overflow-hidden"
      >
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500" />

        <div class="mx-auto w-16 h-16 rounded-full
                    bg-gradient-to-b from-yellow-500/20 to-orange-500/10
                    border-2 border-yellow-500/30
                    flex items-center justify-center mb-3"
        >
          <span class="text-3xl">{{ ev.emoji || '❓' }}</span>
        </div>

        <h2 class="text-base font-bold text-yellow-400 mb-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {{ ev.title }}
        </h2>

        <p class="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
          {{ ev.description }}
        </p>

        <!-- Money effect -->
        <div class="mb-4">
          <span
            v-if="(ev.effect?.money || 0) > 0"
            class="inline-block bg-green-500/15 text-green-400 px-4 py-1.5 rounded-full text-sm font-bold"
          >+{{ ev.effect.money }} 💰</span>
          <span
            v-else-if="(ev.effect?.money || 0) < 0"
            class="inline-block bg-red-500/15 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold"
          >{{ ev.effect.money }} 💰</span>
          <span
            v-else
            class="inline-block bg-gray-700/50 text-gray-400 px-4 py-1.5 rounded-full text-sm font-medium"
          >— 冇金錢增減</span>
        </div>

        <button
          @click="dismiss"
          class="w-full py-3 rounded-xl text-sm font-bold
                 bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                 active:scale-[0.97] transition-all duration-100
                 shadow-[0_3px_0_#b45309] active:shadow-[0_1px_0_#b45309] active:translate-y-[2px]"
        >確 定</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { gameStore } from '../../stores/gameStore.js'
import { dispatchGameEvent } from '../../phaser/events.js'
import { soundManager } from '../../phaser/SoundManager.js'

const store = gameStore
const show = computed(() => (store.showEventModal && store.currentEvent) || store.gameWon)
const ev = computed(() => store.currentEvent || {})
const isTreasure = computed(() => ev.value?.type === 'treasure')
const isWin = computed(() => ev.value?.type === 'win')
const isShop = computed(() => ev.value?.type === 'shop')
const shopItems = computed(() => ev.value?.shopItems || [])

function buyItem(typeId) {
  dispatchGameEvent('game:buy-property', { typeId })
}

function dismiss() {
  const effect = store.currentEvent?.effect
  if (effect) store.addMoney(effect.money ?? 0)
  store.showEventModal = false
  dispatchGameEvent('game:close-event')
}

function restart() {
  store.clearProgress()
  window.location.reload()
}
</script>

<style scoped>
.modal-enter-active { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from,
.modal-leave-to { opacity: 0; transform: scale(0.88) translateY(10px); }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce {
  animation: bounce 0.6s ease-in-out infinite;
}
</style>
