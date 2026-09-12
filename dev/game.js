/* 
 * EchoMaze Foundation
 *
 * Maze/game logic emits events through mazeEvents.
 * Audio subscribes to those events.
 */

// ============================================================
// EVENT SYSTEM
// ============================================================

const mazeEvents = new Phaser.Events.EventEmitter();


// ============================================================
// AUDIO
// ============================================================

const audio = {
  bgm: null,
  step: null,
  wallHit: null,
  success: null
};


// ============================================================
// MAZE
// ============================================================

const MAZE = [
  '#####################',
  '#S......#...........#',
  '#######.#.#########.#',
  '#.......#.#.......#.#',
  '#.#######.#.#####.#.#',
  '#.#.......#.....#.#.#',
  '#.#.#############.#.#',
  '#.#...............#.#',
  '#.###############.#.#',
  '#.................#.#',
  '#################.#.#',
  '#.................#.#',
  '#.#################.#',
  '#..................G#',
  '#####################',
];


// ============================================================
// SETTINGS
// ============================================================

const TILE = 34;


// ============================================================
// DIRECTIONS
// ============================================================

const DIRECTIONS = [
  {
    name: 'north',
    x: 0,
    y: -1,
    angle: -90
  },

  {
    name: 'east',
    x: 1,
    y: 0,
    angle: 0
  },

  {
    name: 'south',
    x: 0,
    y: 1,
    angle: 90
  },

  {
    name: 'west',
    x: -1,
    y: 0,
    angle: 180
  }
];


// ============================================================
// CHECKPOINTS
// ============================================================

const CHECKPOINTS = [
  {
    x: 4,
    y: 1,
    label: 'Checkpoint 1'
  },

  {
    x: 7,
    y: 3,
    label: 'Checkpoint 2'
  },

  {
    x: 7,
    y: 5,
    label: 'Checkpoint 3'
  },

  {
    x: 3,
    y: 7,
    label: 'Checkpoint 4'
  },

  {
    x: 10,
    y: 9,
    label: 'Checkpoint 5'
  },

  {
    x: 17,
    y: 11,
    label: 'Checkpoint 6'
  }
];


// ============================================================
// GAME DIMENSIONS
// ============================================================

const gameWidth = MAZE[0].length * TILE;
const gameHeight = MAZE.length * TILE;


// ============================================================
// START / GOAL
// ============================================================

const start = findTile('S');
const goal = findTile('G');


// ============================================================
// DISTANCE MAP
// ============================================================

const distances = createDistanceMap(start);

CHECKPOINTS.forEach((checkpoint) => {
  checkpoint.distance = distances.get(
    key(checkpoint)
  );
});


// ============================================================
// PHASER GAME
// ============================================================

new Phaser.Game({
  type: Phaser.AUTO,

  parent: 'game',

  width: gameWidth,

  height: gameHeight,

  backgroundColor: '#071119',

  scene: {
    preload,
    create
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});


// ============================================================
// PRELOAD
// ============================================================

function preload() {

  // Background music
  this.load.audio(
    'bgm',
    'assets/audio/bgm.mp3'
  );

  // Successful movement
  this.load.audio(
    'step',
    'assets/audio/step.mp3'
  );

  // Wall collision
  this.load.audio(
    'wallHit',
    'assets/audio/wall-hit.mp3'
  );

  // Goal / success
  this.load.audio(
    'success',
    'assets/audio/success.mp3'
  );


  // Show loading errors in browser console
  this.load.on(
    Phaser.Loader.Events.FILE_LOAD_ERROR,
    (file) => {

      console.error(
        'Failed to load:',
        file.key,
        file.src
      );

    }
  );
}


// ============================================================
// CREATE
// ============================================================

function create() {

  const scene = this;


  // ==========================================================
  // AUDIO INITIALIZATION
  // ==========================================================

  audio.bgm = scene.sound.add(
    'bgm',
    {
      loop: true,
      volume: 0.15
    }
  );


  audio.step = scene.sound.add(
    'step',
    {
      volume: 0.5
    }
  );


  audio.wallHit = scene.sound.add(
    'wallHit',
    {
      volume: 0.8
    }
  );


  audio.success = scene.sound.add(
    'success',
    {
      volume: 1.0
    }
  );


  // ==========================================================
  // GAME STATE
  // ==========================================================

  const state = {

    x: start.x,

    y: start.y,

    // 0 = north
    // 1 = east
    // 2 = south
    // 3 = west

    direction: 1,

    checkpoint: -1,

    completed: false
  };


  // ==========================================================
  // DRAW MAZE
  // ==========================================================

  drawMaze(scene);


  // ==========================================================
  // PLAYER
  // ==========================================================

  /*
   * Draw the player after the maze so
   * the player stays visible.
   */

  const player = scene.add
    .triangle(
      0,
      0,
      0,
      26,
      22,
      13,
      0,
      0,
      0x63e6be
    )
    .setOrigin(0.5)
    .setDepth(10);


  // ==========================================================
  // INITIAL DISPLAY
  // ==========================================================

  refresh();


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const keys = scene.input.keyboard.addKeys({

    up: 'UP',

    down: 'DOWN',

    left: 'LEFT',

    right: 'RIGHT',

    restart: 'R',

    info: 'I'

  });


  // ==========================================================
  // KEYBOARD EVENTS
  // ==========================================================

  scene.input.keyboard.on(
    'keydown',
    (event) => {

      // ------------------------------------------------------
      // RESTART
      // ------------------------------------------------------

      if (event.code === 'KeyR') {

        restart();

        return;
      }


      // ------------------------------------------------------
      // ORIENTATION
      // ------------------------------------------------------

      if (event.code === 'KeyI') {

        orientationQuery();

        return;
      }


      // ------------------------------------------------------
      // IGNORE MOVEMENT AFTER COMPLETION
      // ------------------------------------------------------

      if (state.completed) {

        return;
      }


      // ------------------------------------------------------
      // ARROW UP
      // ------------------------------------------------------

      if (event.code === 'ArrowUp') {

        moveInDirection(
          0,
          -1,
          'north'
        );

      }


      // ------------------------------------------------------
      // ARROW DOWN
      // ------------------------------------------------------

      else if (event.code === 'ArrowDown') {

        moveInDirection(
          0,
          1,
          'south'
        );

      }


      // ------------------------------------------------------
      // ARROW LEFT
      // ------------------------------------------------------

      else if (event.code === 'ArrowLeft') {

        moveInDirection(
          -1,
          0,
          'west'
        );

      }


      // ------------------------------------------------------
      // ARROW RIGHT
      // ------------------------------------------------------

      else if (event.code === 'ArrowRight') {

        moveInDirection(
          1,
          0,
          'east'
        );

      }

    }
  );


  // ==========================================================
  // AUDIO EVENT SUBSCRIPTIONS
  // ==========================================================

  /*
   * Successful movement
   * → Step sound
   */

  mazeEvents.on(
    'playerMoved',
    (data) => {

      // Don't play a step sound for restart
      if (data.action === 'move') {

        playStep();

      }

    }
  );


  /*
   * Wall collision
   * → Wall-hit sound
   */

  mazeEvents.on(
    'collision',
    () => {

      playWallHit();

    }
  );


  /*
   * Goal reached
   * → Success sound
   */

  mazeEvents.on(
    'goalReached',
    () => {

      playSuccess();


      // Stop background music
      if (
        audio.bgm &&
        audio.bgm.isPlaying
      ) {

        audio.bgm.stop();

      }

    }
  );


  // ==========================================================
  // START BGM AFTER USER INTERACTION
  // ==========================================================

  /*
   * Browsers normally block autoplay.
   * Therefore BGM starts after the first keyboard input.
   */

  scene.input.keyboard.once(
    'keydown',
    () => {

      startBGM();

    }
  );


  /*
   * Also support mouse/touch interaction.
   */

  scene.input.once(
    'pointerdown',
    () => {

      startBGM();

    }
  );


  // Prevent unused-variable warnings
  void keys;
  void scene;
  void state;
  void player;


  // ==========================================================
  // MOVEMENT FUNCTION
  // ==========================================================

  function moveInDirection(
    dx,
    dy,
    facing
  ) {

    const next = {

      x: state.x + dx,

      y: state.y + dy

    };


    // --------------------------------------------------------
    // ROTATE PLAYER
    // --------------------------------------------------------

    const directionIndex =
      DIRECTIONS.findIndex(
        direction =>
          direction.name === facing
      );


    state.direction =
      directionIndex;


    // --------------------------------------------------------
    // WALL CHECK
    // --------------------------------------------------------

    if (isWall(next)) {

      mazeEvents.emit(
        'collision',
        snapshot('blocked')
      );

      refresh(
        'Wall ahead.'
      );

      return;
    }


    // --------------------------------------------------------
    // CHECKPOINT RESTRICTION
    // --------------------------------------------------------

    if (isBehindCheckpoint(next)) {

      mazeEvents.emit(
        'collision',
        snapshot('blocked')
      );

      refresh(
        'The active checkpoint blocks the path behind you.'
      );

      return;
    }


    // --------------------------------------------------------
    // MOVE PLAYER
    // --------------------------------------------------------

    state.x = next.x;

    state.y = next.y;


    // --------------------------------------------------------
    // PLAYER MOVED EVENT
    // --------------------------------------------------------

    mazeEvents.emit(
      'playerMoved',
      snapshot('move')
    );


    // --------------------------------------------------------
    // CHECKPOINT
    // --------------------------------------------------------

    activateCheckpoint();


    // --------------------------------------------------------
    // GOAL
    // --------------------------------------------------------

    if (
      state.x === goal.x &&
      state.y === goal.y
    ) {

      state.completed = true;


      mazeEvents.emit(
        'goalReached',
        snapshot('goal')
      );


      refresh(
        'Goal reached. Maze completed!'
      );


      return;
    }


    // --------------------------------------------------------
    // NORMAL MOVEMENT MESSAGE
    // --------------------------------------------------------

    refresh(
      `Moved ${facing}.`
    );
  }


  // ==========================================================
  // CHECKPOINT ACTIVATION
  // ==========================================================

  function activateCheckpoint() {

    const index =
      CHECKPOINTS.findIndex(
        point =>
          point.x === state.x &&
          point.y === state.y
      );


    if (
      index > state.checkpoint
    ) {

      state.checkpoint = index;


      mazeEvents.emit(
        'checkpointReached',
        snapshot('checkpoint')
      );

    }
  }


  // ==========================================================
  // CHECKPOINT RESTRICTION
  // ==========================================================

  function isBehindCheckpoint(next) {

    if (
      state.checkpoint < 0
    ) {

      return false;
    }


    return (
      distances.get(
        key(next)
      ) <
      CHECKPOINTS[
        state.checkpoint
      ].distance
    );
  }


  // ==========================================================
  // ORIENTATION
  // ==========================================================

  function orientationQuery() {

    const direction =
      DIRECTIONS[
        state.direction
      ].name;


    refresh(
      `Facing ${direction}.`
    );
  }


  // ==========================================================
  // RESTART
  // ==========================================================

  function restart() {

    state.x = start.x;

    state.y = start.y;

    state.direction = 1;

    state.checkpoint = -1;

    state.completed = false;


    // Stop old BGM if needed
    if (
      audio.bgm &&
      audio.bgm.isPlaying
    ) {

      audio.bgm.stop();

    }


    // Restart BGM
    startBGM();


    mazeEvents.emit(
      'playerMoved',
      snapshot('restart')
    );


    refresh(
      'Maze restarted. Facing east.'
    );
  }


  // ==========================================================
  // SNAPSHOT
  // ==========================================================

  function snapshot(action) {

    return {

      action,

      x: state.x,

      y: state.y,

      facing:
        DIRECTIONS[
          state.direction
        ].name,

      checkpoint:
        state.checkpoint + 1

    };
  }


  // ==========================================================
  // REFRESH UI
  // ==========================================================

  function refresh(
    message = 'Maze ready. Facing east.'
  ) {

    // Move player
    player
      .setPosition(
        state.x * TILE +
        TILE / 2,

        state.y * TILE +
        TILE / 2
      )
      .setAngle(
        DIRECTIONS[
          state.direction
        ].angle
      );


    // Position
    const position =
      document.querySelector(
        '#position'
      );

    if (position) {

      position.textContent =
        `${state.x}, ${state.y}`;

    }


    // Facing
    const facingElement =
      document.querySelector(
        '#facing'
      );

    if (facingElement) {

      facingElement.textContent =
        DIRECTIONS[
          state.direction
        ].name;

    }


    // Checkpoint
    const checkpoint =
      document.querySelector(
        '#checkpoint'
      );

    if (checkpoint) {

      checkpoint.textContent =
        state.checkpoint >= 0
          ? state.checkpoint + 1
          : 'None';

    }


    // Latest event
    const event =
      document.querySelector(
        '#event'
      );

    if (event) {

      event.textContent =
        message;

    }
  }
}


// ============================================================
// DRAW MAZE
// ============================================================

function drawMaze(scene) {

  MAZE.forEach(
    (row, y) => {

      [...row].forEach(
        (cell, x) => {

          const centerX =
            x * TILE +
            TILE / 2;

          const centerY =
            y * TILE +
            TILE / 2;


          // --------------------------------------------------
          // WALL
          // --------------------------------------------------

          if (cell === '#') {

            scene.add
              .rectangle(
                centerX,
                centerY,
                TILE,
                TILE,
                0x25364d
              )
              .setStrokeStyle(
                1,
                0x405775
              );

          }


          // --------------------------------------------------
          // FLOOR
          // --------------------------------------------------

          else {

            scene.add
              .rectangle(
                centerX,
                centerY,
                TILE,
                TILE,
                0x0d1b28
              )
              .setStrokeStyle(
                1,
                0x122b3d
              );

          }

        }
      );

    }
  );


  // ==========================================================
  // CHECKPOINTS
  // ==========================================================

  CHECKPOINTS.forEach(
    (point, index) => {

      scene.add
        .circle(
          point.x * TILE +
            TILE / 2,

          point.y * TILE +
            TILE / 2,

          10,

          0xf4c95d
        );


      scene.add
        .text(
          point.x * TILE +
            TILE / 2,

          point.y * TILE +
            TILE / 2,

          String(index + 1),

          {
            fontSize: '13px',

            color: '#071119',

            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5);

    }
  );


  // ==========================================================
  // START LABEL
  // ==========================================================

  const startX =
    start.x * TILE +
    TILE / 2;

  const startY =
    start.y * TILE - 7;


  scene.add
    .text(
      startX,
      startY,
      'START',
      {
        fontSize: '10px',

        color: '#a8d4ff'
      }
    )
    .setOrigin(
      0.5,
      1
    );


  // ==========================================================
  // GOAL LABEL
  // ==========================================================

  const goalX =
    goal.x * TILE +
    TILE / 2;

  const goalY =
    goal.y * TILE - 7;


  scene.add
    .text(
      goalX,
      goalY,
      'GOAL',
      {
        fontSize: '10px',

        color: '#ffb8aa'
      }
    )
    .setOrigin(
      0.5,
      1
    );
}


// ============================================================
// FIND TILE
// ============================================================

function findTile(character) {

  for (
    let y = 0;
    y < MAZE.length;
    y++
  ) {

    const x =
      MAZE[y].indexOf(
        character
      );


    if (x !== -1) {

      return {
        x,
        y
      };

    }
  }


  throw new Error(
    `${character} missing from maze`
  );
}


// ============================================================
// WALL CHECK
// ============================================================

function isWall(point) {

  return (

    point.y < 0 ||

    point.y >= MAZE.length ||

    point.x < 0 ||

    point.x >= MAZE[0].length ||

    MAZE[
      point.y
    ][
      point.x
    ] === '#'

  );
}


// ============================================================
// CREATE KEY
// ============================================================

function key(point) {

  return `${point.x},${point.y}`;
}


// ============================================================
// CREATE DISTANCE MAP
// ============================================================

function createDistanceMap(from) {

  const queue = [from];


  const result =
    new Map([
      [
        key(from),
        0
      ]
    ]);


  while (
    queue.length
  ) {

    const current =
      queue.shift();


    for (
      const direction of DIRECTIONS
    ) {

      const next = {

        x:
          current.x +
          direction.x,

        y:
          current.y +
          direction.y

      };


      const nextKey =
        key(next);


      if (
        !isWall(next) &&
        !result.has(nextKey)
      ) {

        result.set(
          nextKey,

          result.get(
            key(current)
          ) + 1
        );


        queue.push(next);

      }
    }
  }


  return result;
}


// ============================================================
// AUDIO FUNCTIONS
// ============================================================

function startBGM() {

  if (!audio.bgm) {

    console.warn(
      'BGM audio is not available.'
    );

    return;
  }


  if (
    !audio.bgm.isPlaying
  ) {

    audio.bgm.play();

    console.log(
      'Background music started.'
    );

  }
}


// ============================================================
// STEP SOUND
// ============================================================

function playStep() {

  if (!audio.step) {

    console.warn(
      'Step sound is not available.'
    );

    return;
  }


  audio.step.stop();

  audio.step.play();

  console.log(
    'Step sound'
  );
}


// ============================================================
// WALL HIT SOUND
// ============================================================

function playWallHit() {

  if (!audio.wallHit) {

    console.warn(
      'Wall-hit sound is not available.'
    );

    return;
  }


  audio.wallHit.stop();

  audio.wallHit.play();

  console.log(
    'Wall-hit sound'
  );
}


// ============================================================
// SUCCESS SOUND
// ============================================================

function playSuccess() {

  if (!audio.success) {

    console.warn(
      'Success sound is not available.'
    );

    return;
  }


  audio.success.stop();

  audio.success.play();

  console.log(
    'Success sound'
  );
}


// ============================================================
// MAKE EVENTS AVAILABLE TO OTHER FILES
// ============================================================

window.mazeEvents = mazeEvents;