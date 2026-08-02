# EchoMaze — Phaser 3 Prototype

A deliberately small browser prototype for evaluating Phaser 3 for EchoMaze. It demonstrates a rendered 2D maze, tile-based keyboard movement, wall collision, exit handling, and Phaser scene structure. It is not a complete game.

## Folder structure

```text
.
├── assets/          # Reserved for future audio files
├── GameScene.js     # Maze rendering, player movement, and completion logic
├── index.html       # Page and Phaser script loading
├── main.js          # Phaser game configuration
└── style.css        # Dark page and canvas styling
```

## Installation

1. Download or clone this folder.
2. Open the folder in Visual Studio Code.
3. Install the **Live Server** VS Code extension if it is not already installed.

Phaser is loaded from a CDN, so an internet connection is required the first time the page loads.

## Run with VS Code Live Server

1. In VS Code, open `index.html`.
2. Right-click the file and choose **Open with Live Server**, or use the **Go Live** button in the status bar.
3. The prototype opens in your browser on a local address such as `http://127.0.0.1:5500`.

## Controls

Use the arrow keys to move the blue player square one tile per key press. Black tiles are walls, light-gray tiles are floor, and the green tile is the exit.

## Features implemented

- Phaser 3 scene architecture
- 640 × 480 dark game canvas
- 10 × 10 array-defined maze rendered with colored rectangles
- Tile-based arrow-key movement
- Wall collision checks
- Completion message and disabled input after reaching the exit
- Optional Phaser Audio Manager support for movement and completion cues
- Comments marking Web Audio API integration points

## Audio support

The scene loads audio with Phaser's built-in Audio Manager during `preload()` and creates sound objects in `create()`. Put the following WAV files in `assets/audio/`:

```text
assets/audio/step.wav     # Plays after each successful tile move
assets/audio/success.wav  # Plays once after reaching the green exit
```

Audio is intentionally optional: if either file is missing or cannot load, the maze still runs and the unavailable cue is skipped. This validates Phaser's basic audio-loading and sound-playback workflow alongside EchoMaze's rendering, keyboard navigation, collision detection, and scene management. TODO comments in `GameScene.js` mark the next accessibility experiments: directional cues, distance-based volume, and voice guidance using the Web Audio API.

## Future improvements

- Supply `step.wav` and `success.wav` assets, then tune their levels
- Experiment with spatial audio cues for maze navigation
- Generate mazes procedurally
- Add restart, timer, accessibility, and mobile controls
- Load real visual and audio assets from `assets/`
