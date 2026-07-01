<template>
  <TitleScreen v-if="!gameStore.gameStarted" @start="startGame" />
  <GameView v-else />
</template>

<script setup>
import { gameStore } from './stores/gameStore.js'
import TitleScreen from './vue/components/TitleScreen.vue'
import GameView from './vue/views/GameView.vue'

const store = gameStore

function startGame() {
  store.gameStarted = true
}
</script>
