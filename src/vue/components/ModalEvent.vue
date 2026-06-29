<template>
  <Transition name="modal">
    <div
      v-if="store.showEventModal && store.currentEvent"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="dismiss"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70" @click="dismiss" />

      <!-- Modal card -->
      <div
        class="relative w-full max-w-sm
               bg-gradient-to-b from-gray-900 to-gray-950
               border-4 border-yellow-500 rounded-2xl
               shadow-[0_0_30px_rgba(234,179,8,0.2)]
               p-6 text-center"
      >
        <!-- Emoji -->
        <div class="text-5xl mb-3">{{ store.currentEvent.emoji || '❓' }}</div>

        <!-- Title -->
        <h2
          class="text-lg font-pixel text-yellow-400 mb-4 leading-relaxed"
        >{{ store.currentEvent.title }}</h2>

        <!-- Description -->
        <p
          class="text-gray-300 text-sm leading-relaxed mb-5 whitespace-pre-line"
        >{{ store.currentEvent.description }}</p>

        <!-- Money effect -->
        <div class="mb-5">
          <span
            v-if="(store.currentEvent.effect?.money || 0) > 0"
            class="text-green-400 text-lg font-pixel"
          >+{{ store.currentEvent.effect.money }} 💰</span>
          <span
            v-else-if="(store.currentEvent.effect?.money || 0) < 0"
            class="text-red-400 text-lg font-pixel"
          >{{ store.currentEvent.effect.money }} 💰</span>
          <span
            v-else
            class="text-gray-400 text-sm font-pixel"
          >冇金錢增減</span>
        </div>

        <!-- Confirm -->
        <button
          @click="dismiss"
          class="w-full py-3 rounded-xl
                 bg-gradient-to-r from-yellow-500 to-orange-500
                 font-pixel text-sm text-black font-bold
                 active:scale-[0.97] transition-transform"
        >確 定</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { gameStore } from '../../stores/gameStore.js'
import { dispatchGameEvent, PHASER_EVENTS } from '../../phaser/events.js'

function dismiss() {
  // Apply money effect before closing
  const effect = store.currentEvent?.effect
  if (effect) {
    store.addMoney(effect.money ?? 0)
  }
  store.showEventModal = false
  dispatchGameEvent(PHASER_EVENTS.CLOSE_EVENT)
}

// Alias store so template can use it
const store = gameStore
</script>

<style scoped>
.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from,
.modal-leave-to { opacity: 0; transform: scale(0.88); }
</style>
