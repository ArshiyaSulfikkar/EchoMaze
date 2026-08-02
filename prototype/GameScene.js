/* global Phaser */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.tileSize = 40;
    this.mazeOffsetX = 120;
    this.mazeOffsetY = 40;
    this.playerPosition = { row: 1, col: 1 };
    this.isComplete = false;
  }

  create() {
    // 0 = floor, 1 = wall, 2 = exit. This 10x10 array is easy to replace later.
    this.maze = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    this.drawMaze();
    this.createPlayer();
    this.initializeAudio();
    this.cursors = this.input.keyboard.createCursorKeys();

    // Future Web Audio API integration point: connect Phaser audio nodes to a
    // custom AudioContext here after a user interaction, if needed.
  }

  preload() {
    // Audio is optional. Phaser reports a missing file through this loader event
    // but continues loading the scene; initializeAudio() only uses cached files.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleAudioLoadError, this);
    this.load.audio("step", "assets/audio/step.wav");
    this.load.audio("success", "assets/audio/success.wav");
  }

  update() {
    if (this.isComplete) {
      return;
    }

    // JustDown makes every press a single tile move instead of continuous motion.
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.tryMove(0, -1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.tryMove(0, 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.tryMove(-1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.tryMove(1, 0);
    }
  }

  drawMaze() {
    this.maze.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        const color = tile === 1 ? 0x000000 : tile === 2 ? 0x39a845 : 0xd3d6da;
        const x = this.mazeOffsetX + colIndex * this.tileSize;
        const y = this.mazeOffsetY + rowIndex * this.tileSize;
        this.add.rectangle(x, y, this.tileSize - 1, this.tileSize - 1, color).setOrigin(0);
      });
    });
  }

  createPlayer() {
    this.player = this.add.rectangle(0, 0, this.tileSize - 10, this.tileSize - 10, 0x2878d4);
    this.player.setStrokeStyle(2, 0xb8dcff);
    this.updatePlayerVisual();
  }

  tryMove(rowChange, colChange) {
    const nextRow = this.playerPosition.row + rowChange;
    const nextCol = this.playerPosition.col + colChange;

    // A wall (or outside the array) is not a valid destination.
    if (!this.isWalkable(nextRow, nextCol)) {
      return;
    }

    this.playerPosition = { row: nextRow, col: nextCol };
    this.updatePlayerVisual();

    // Play only after a valid tile move, never when a wall blocked the player.
    this.playStepSound();

    // TODO: Add directional audio cues for left/right navigation.
    // TODO: Adjust cue volume based on distance to the exit or walls.
    // TODO: Add voice guidance integration for accessible navigation.
    if (this.maze[nextRow][nextCol] === 2) {
      this.completeMaze();
    }
  }

  isWalkable(row, col) {
    return row >= 0 && row < this.maze.length && col >= 0 && col < this.maze[row].length && this.maze[row][col] !== 1;
  }

  updatePlayerVisual() {
    const x = this.mazeOffsetX + this.playerPosition.col * this.tileSize + this.tileSize / 2;
    const y = this.mazeOffsetY + this.playerPosition.row * this.tileSize + this.tileSize / 2;
    this.player.setPosition(x, y);
  }

  completeMaze() {
    this.isComplete = true;
    // This runs once because update() stops accepting movement after completion.
    this.playSuccessSound();
    this.add
      .text(320, 240, "Maze Completed!", {
        fontFamily: "Arial, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: "#16202b",
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(1);
  }

  initializeAudio() {
    // Only create Phaser Sound objects for audio files that loaded successfully.
    this.stepSound = this.cache.audio.exists("step") ? this.sound.add("step") : null;
    this.successSound = this.cache.audio.exists("success") ? this.sound.add("success") : null;
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleAudioLoadError, this);
  }

  playStepSound() {
    if (this.stepSound) {
      this.stepSound.play();
    }
  }

  playSuccessSound() {
    if (this.successSound) {
      this.successSound.play();
    }
  }

  handleAudioLoadError(file) {
    // Do not interrupt gameplay when optional audio has not been supplied yet.
    if (file.key === "step" || file.key === "success") {
      console.info(`Optional audio file not loaded: ${file.src}`);
    }
  }
}
