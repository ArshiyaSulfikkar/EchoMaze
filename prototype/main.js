/* global Phaser, GameScene */

// Game configuration stays separate from scene logic for easy expansion.
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 640,
  height: 480,
  backgroundColor: "#171b22",
  scene: [GameScene],
  pixelArt: true,
};

new Phaser.Game(config);
