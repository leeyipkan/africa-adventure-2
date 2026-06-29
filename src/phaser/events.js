// ─── Custom event names for Phaser ↔ Vue communication ───
export const PHASER_EVENTS = {
  ROLL_DICE:     'game:roll-dice',     // Vue → Phaser: user tapped dice
  DICE_START:    'game:dice-start',    // Phaser → Vue: dice rolling begins
  DICE_END:      'game:dice-end',      // Phaser → Vue: dice result known
  PLAYER_LANDED: 'game:player-landed', // Phaser → Vue: piece stopped
  CLOSE_EVENT:   'game:close-event',   // Vue → Phaser: modal dismissed
  TURN_END:      'game:turn-end',      // Phaser → Vue: turn fully done
}

// ─── Helpers ───
export function dispatchGameEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export function onGameEvent(name, handler) {
  const wrapper = (e) => handler(e.detail)
  window.addEventListener(name, wrapper)
  // Return cleanup
  return () => window.removeEventListener(name, wrapper)
}
