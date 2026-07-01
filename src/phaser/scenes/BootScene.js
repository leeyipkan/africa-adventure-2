import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Show loading bar
    const w = this.cameras.main.width
    const h = this.cameras.main.height

    const barW = 280, barH = 20
    const bx = (w - barW) / 2, by = h / 2 - 10

    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a1a)
    bg.fillRect(0, 0, w, h)

    this.add.text(w / 2, by - 30, '🌍 非洲探險 2', {
      fontSize: '16px', fontFamily: '"Press Start 2P", monospace',
      color: '#e2b714', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5)

    const barBg = this.add.graphics()
    barBg.fillStyle(0x222244)
    barBg.fillRoundedRect(bx, by, barW, barH, 4)

    const bar = this.add.graphics()
    this.load.on('progress', (v) => {
      bar.clear()
      bar.fillStyle(0xe2b714)
      bar.fillRoundedRect(bx + 2, by + 2, (barW - 4) * v, barH - 4, 3)
    })

    // Load tile textures
    this.load.image('tile-start',  'assets/tile-start.png')
    this.load.image('tile-grass',  'assets/tile-grass.png')
    this.load.image('tile-market', 'assets/tile-market.png')
    this.load.image('tile-jungle', 'assets/tile-jungle.png')
    this.load.image('tile-mine',   'assets/tile-mine.png')
    this.load.image('tile-desert', 'assets/tile-desert.png')
    this.load.image('tile-river',  'assets/tile-river.png')
    this.load.image('tile-village','assets/tile-village.png')
    this.load.image('player',      'assets/player.png')
  }

  create() {
    this.scene.start('BoardScene')
  }
}
