/* global Phaser */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.tileSize = 40;
    this.mazeOffsetX = 120;
    this.mazeOffsetY = 40;

    this.playerPosition = {
      row: 1,
      col: 1
    };

    this.isComplete = false;
    this.bgmStarted = false;
  }

  preload() {
    // Handle optional audio loading errors
    this.load.on(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      this.handleAudioLoadError,
      this
    );

    // Audio files
    this.load.audio("bgm", "assets/audio/bgm.wav");
    this.load.audio("step", "assets/audio/step.wav");
    this.load.audio("wallHit", "assets/audio/wall-hit.wav");
    this.load.audio("success", "assets/audio/success.wav");
  }

  create() {
    /*
      Maze values:
      0 = floor
      1 = wall
      2 = exit
    */

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
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    // Draw maze
    this.drawMaze();

    // Player state
    this.state = {
      x: this.playerPosition.col,
      y: this.playerPosition.row,
      direction: 1,
      checkpoint: -1,
      completed: false
    };

    // Create player
    this.createPlayer();

    // Initialize audio
    this.initializeAudio();

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

    /*
      Start BGM after the first user interaction.
      This avoids browser autoplay restrictions.
    */
    this.input.once("pointerdown", () => {
      this.startBackgroundMusic();
    });

    this.input.keyboard.once("keydown", () => {
      this.startBackgroundMusic();
    });
  }

  update() {
    if (this.isComplete) {
      return;
    }

    /*
      Each arrow-key press moves exactly one tile.
    */

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

  // ============================================================
  // MAZE
  // ============================================================

  drawMaze() {
    this.maze.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        let color;

        if (tile === 1) {
          // Wall
          color = 0x000000;
        } else if (tile === 2) {
          // Exit
          color = 0x39a845;
        } else {
          // Floor
          color = 0xd3d6da;
        }

        const x =
          this.mazeOffsetX +
          colIndex * this.tileSize;

        const y =
          this.mazeOffsetY +
          rowIndex * this.tileSize;

        this.add
          .rectangle(
            x,
            y,
            this.tileSize - 1,
            this.tileSize - 1,
            color
          )
          .setOrigin(0);
      });
    });
  }

  // ============================================================
  // PLAYER
  // ============================================================

  createPlayer() {
    const size = this.tileSize - 10;
    const half = size / 2;

    /*
      Triangle-shaped player.
    */

    this.player = this.add
      .triangle(
        0,
        0,
        0,
        -half,
        half,
        half,
        -half,
        half,
        0x63e6be
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.player.setStrokeStyle(
      2,
      0xb8dcff
    );

    this.updatePlayerVisual();
  }

  updatePlayerVisual() {
    const x =
      this.mazeOffsetX +
      this.playerPosition.col * this.tileSize +
      this.tileSize / 2;

    const y =
      this.mazeOffsetY +
      this.playerPosition.row * this.tileSize +
      this.tileSize / 2;

    this.player.setPosition(x, y);

    // Keep state synchronized
    if (this.state) {
      this.state.x = this.playerPosition.col;
      this.state.y = this.playerPosition.row;
    }
  }

  // ============================================================
  // PLAYER MOVEMENT
  // ============================================================

  tryMove(rowChange, colChange) {
    const nextRow =
      this.playerPosition.row + rowChange;

    const nextCol =
      this.playerPosition.col + colChange;

    /*
      Check whether the destination is walkable.
    */

    if (!this.isWalkable(nextRow, nextCol)) {
      /*
        🧱 WALL HIT

        The player does not move.
        Only wall-hit sound plays.
      */

      this.playWallHitSound();

      return;
    }

    /*
      VALID MOVEMENT
    */

    this.playerPosition = {
      row: nextRow,
      col: nextCol
    };

    // Update player position
    this.updatePlayerVisual();

    /*
      👣 STEP SOUND

      This only happens after a successful movement.
    */

    this.playStepSound();

    /*
      Check whether the player reached the exit.
    */

    if (this.maze[nextRow][nextCol] === 2) {
      this.completeMaze();
    }
  }

  isWalkable(row, col) {
    /*
      Prevent movement outside the maze.
    */

    if (
      row < 0 ||
      row >= this.maze.length ||
      col < 0 ||
      col >= this.maze[row].length
    ) {
      return false;
    }

    /*
      Tile 1 = wall
      Tile 0 = floor
      Tile 2 = exit
    */

    return this.maze[row][col] !== 1;
  }

  // ============================================================
  // AUDIO INITIALIZATION
  // ============================================================

  initializeAudio() {
    /*
      Background music
    */

    this.bgmSound = this.cache.audio.exists("bgm")
      ? this.sound.add("bgm", {
          loop: true,
          volume: 0.15
        })
      : null;

    /*
      Step sound
    */

    this.stepSound = this.cache.audio.exists("step")
      ? this.sound.add("step", {
          volume: 0.5
        })
      : null;

    /*
      Wall-hit sound
    */

    this.wallHitSound = this.cache.audio.exists("wallHit")
      ? this.sound.add("wallHit", {
          volume: 0.8
        })
      : null;

    /*
      Success sound
    */

    this.successSound = this.cache.audio.exists("success")
      ? this.sound.add("success", {
          volume: 1.0
        })
      : null;

    /*
      Remove the loading error listener
      after audio initialization.
    */

    this.load.off(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      this.handleAudioLoadError,
      this
    );
  }

  // ============================================================
  // BACKGROUND MUSIC
  // ============================================================

  startBackgroundMusic() {
    /*
      Prevent BGM from starting multiple times.
    */

    if (this.bgmStarted) {
      return;
    }

    if (!this.bgmSound) {
      return;
    }

    /*
      Phaser sound manager may be locked by the browser
      until the user interacts with the page.
    */

    if (this.sound.locked) {
      this.sound.once(
        Phaser.Sound.Events.UNLOCK,
        () => {
          this.startBackgroundMusic();
        }
      );

      return;
    }

    /*
      Start BGM.
    */

    if (!this.bgmSound.isPlaying) {
      this.bgmSound.play();
      this.bgmStarted = true;
    }
  }

  // ============================================================
  // STEP SOUND
  // ============================================================

  playStepSound() {
    if (!this.stepSound) {
      return;
    }

    /*
      Stop previous step sound if necessary,
      then play it again.
    */

    this.stepSound.stop();
    this.stepSound.play();
  }

  // ============================================================
  // WALL HIT SOUND
  // ============================================================

  playWallHitSound() {
    if (!this.wallHitSound) {
      return;
    }

    /*
      Stop previous wall sound and replay it.
      This makes rapid wall presses responsive.
    */

    this.wallHitSound.stop();
    this.wallHitSound.play();
  }

  // ============================================================
  // SUCCESS SOUND
  // ============================================================

  playSuccessSound() {
    if (!this.successSound) {
      return;
    }

    this.successSound.stop();
    this.successSound.play();
  }

  // ============================================================
  // MAZE COMPLETION
  // ============================================================

  completeMaze() {
    /*
      Prevent completion from happening multiple times.
    */

    if (this.isComplete) {
      return;
    }

    this.isComplete = true;

    /*
      Update state.
    */

    if (this.state) {
      this.state.completed = true;
    }

    /*
      🏁 SUCCESS SOUND
    */

    this.playSuccessSound();

    /*
      Stop background music after completing the maze.
    */

    if (
      this.bgmSound &&
      this.bgmSound.isPlaying
    ) {
      this.bgmSound.stop();
    }

    /*
      Completion message.
    */

    this.add
      .text(
        320,
        240,
        "Maze Completed!",
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "32px",
          fontStyle: "bold",
          color: "#ffffff",
          backgroundColor: "#16202b",
          padding: {
            x: 16,
            y: 10
          }
        }
      )
      .setOrigin(0.5)
      .setDepth(20);
  }

  // ============================================================
  // AUDIO ERROR HANDLING
  // ============================================================

  handleAudioLoadError(file) {
    /*
      Audio is optional.
      Gameplay should continue even if an audio file
      is missing.
    */

    console.info(
      `Optional audio file not loaded: ${file.key} - ${file.src}`
    );
  }
}