import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    // Simple boot → straight to game
    this.scene.start('BoardScene')
  }
}
