# Africa Adventure 2 — Treasure Prototype

**Date:** 2026-07-01  
**Approach:** Option A (complete game experience)  
**Design approval:** ✅ after self-review hybrid + option A

---

## 1. Goal

Transform africa-adventure-2 from an infinite-exploration sandbox into a **winnable game for 4-6 year old kids** by adding treasure collection as a victory condition, mobile-friendly movement controls, and polish.

---

## 2. Feature Spec

### 2.1 Treasure System (Hybrid Discovery)

| Aspect | Detail |
|--------|--------|
| **Count** | 5 treasures hidden across the 20×20 map |
| **Placement** | Seed-based, distributed across 4 quadrants, one per major biome (desert, jungle, river, mine, village/market) |
| **Discovery** | **Hybrid**: A compass-style hint on HUD points vaguely toward nearest undiscovered treasure ("寶物喺東南面約 10 格"). When player is within 3 tiles, the treasure tile glows with a golden shimmer |
| **Collection** | Walk onto the glowing tile → treasure modal replaces biome event |
| **Effect** | +$200, special emoji animation, treasure marker turns into a collected flag |

### 2.2 Treasure vs Event Conflict

**Option A** — Treasure tile completely replaces biome event. No double-modal.

### 2.3 Win Condition

| Aspect | Detail |
|--------|--------|
| **Trigger** | Collect all 5 treasures |
| **Modal** | Victory screen with: 🎉 animation, stats (steps taken, money earned, % explored), "再玩一次" button |
| **After** | Button reloads the game → fresh state |

### 2.4 Mobile Controls

| Input | Action |
|:------|:-------|
| **Click tile (existing)** | Walk to adjacent tile (preserved) |
| **Swipe** | Pointer down → move ≥30px → release: walk one tile in that direction |
| **Fallback** | If Phaser swipe is unreliable, add 4 semi-transparent arrow overlays in Vue layer |

### 2.5 Sound Effects

| Sound | Trigger | Format |
|:------|:--------|:-------|
| Step | On player move | Short click/step (Web Audio oscillator) |
| Treasure | On treasure collect | Ascending chime |
| Event | On biome event popup | Soft notification |
| Win | On game won | Fanfare |
| **Mute toggle** | HUD speaker icon 🔇/🔊 | Toggle all sounds |

---

## 3. Architecture Changes

### 3.1 gameStore.js — New State

```js
treasures: Array<{x, y, found: boolean, biome: string}>  // 5 items
treasuresFound: number        // 0–5
gameWon: boolean              // true when all 5 found
hintDirection: string|null    // "東南" etc
hintDistance: number|null     // approximate tile distance
```

### 3.2 BoardScene.js — New Features

- **Treasure markers** — Phaser image/graphics on treasure tiles, hidden by default, revealed within 3-tile range as golden glow
- **Swipe handler** — `scene.input.on('pointerdown')` → track position → `pointerup` calculate direction
- **Treasure collection** — walk onto glowing tile → trigger treasure event instead of biome event
- **Win check** — after every move, `if (treasuresFound === 5) → dispatch game:won`

### 3.3 SoundManager.js — New File

```js
class SoundManager {
  constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  play(soundName) { /* oscillator-based short sounds */ }
  setMuted(v) { this.muted = v; }
}
```

### 3.4 Vue Components — Changes

- **GameHUD.vue**: Add treasure counter badge + compass hint + mute toggle
- **ModalEvent.vue**: Treasure variant (gold border) + win variant (full-screen celebration)
- **DiceButton.vue**: No changes needed

---

## 4. Implementation Tasks

| # | Task | Files | Est. |
|:-:|:-----|:------|:----:|
| 1 | Treasure placement algorithm + store state | gameStore.js | 30 min |
| 2 | Treasure rendering + hint reveal in BoardScene | BoardScene.js | 45 min |
| 3 | Swipe input handler | BoardScene.js | 30 min |
| 4 | SoundManager + audio integration | SoundManager.js, BoardScene.js | 30 min |
| 5 | HUD updates (treasure counter, compass, mute) | GameHUD.vue | 20 min |
| 6 | Treasure modal + win modal | ModalEvent.vue | 30 min |
| 7 | Build, deploy, E2E test | — | 20 min |

**Total:** ~3 hours

---

## 5. What's NOT in This Prototype

- ❌ Character selection (deferred to full release)
- ❌ Background music (deferred)
- ❌ Tile size increase (deferred — would cascade through all rendering)
- ❌ Full animated ending (simple modal is sufficient for kids)

---

## 6. Risks

| Risk | Mitigation |
|:-----|:-----------|
| Swipe conflicts with Phaser click zones | Fallback to arrow overlay buttons in Vue |
| Treasure unreachable in corner | Placement algorithm checks adjacency from start path |
| AudioContext blocked by browser autoplay policy | Resume on first user interaction |
| Kids confused by compass direction | Always show the golden glow when close; compass is secondary hint |
