/* EchoMaze foundation. Audio and speech subscribe to mazeEvents; they do not belong here. */
const mazeEvents = new Phaser.Events.EventEmitter();

const MAZE = [
  '#####################',
  '#S..................#',
  '###################.#',
  '#...................#',
  '#.###################',
  '#...................#',
  '###################.#',
  '#...................#',
  '#.###################',
  '#...................#',
  '###################.#',
  '#...................#',
  '#.###################',
  '#..................G#',
  '#####################',
];

const TILE = 34;
const DIRECTIONS = [
  { name: 'north', x: 0, y: -1, angle: -90 },
  { name: 'east', x: 1, y: 0, angle: 0 },
  { name: 'south', x: 0, y: 1, angle: 90 },
  { name: 'west', x: -1, y: 0, angle: 180 },
];
const CHECKPOINTS = [
  { x: 4, y: 1, label: 'Checkpoint 1' },
  { x: 16, y: 1, label: 'Checkpoint 2' },
  { x: 14, y: 3, label: 'Checkpoint 3' },
  { x: 5, y: 5, label: 'Checkpoint 4' },
  { x: 10, y: 9, label: 'Checkpoint 5' },
  { x: 7, y: 13, label: 'Checkpoint 6' },
];

const gameWidth = MAZE[0].length * TILE;
const gameHeight = MAZE.length * TILE;
const start = findTile('S');
const goal = findTile('G');
const distances = createDistanceMap(start);
CHECKPOINTS.forEach((checkpoint) => { checkpoint.distance = distances.get(key(checkpoint)); });

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: gameWidth,
  height: gameHeight,
  backgroundColor: '#071119',
  scene: { create },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});

function create() {
  const scene = this;
  const state = { x: start.x, y: start.y, direction: 1, checkpoint: -1, completed: false };
  const player = scene.add.triangle(0, 0, 0, 26, 22, 13, 0, 0, 0x63e6be).setOrigin(.5);
  drawMaze(scene);
  refresh();

  const keys = scene.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', restart: 'R', info: 'I' });
  scene.input.keyboard.on('keydown', (event) => {
    if (event.code === 'KeyR') return restart();
    if (event.code === 'KeyI' || (keys.up.isDown && keys.down.isDown)) return orientationQuery();
    if (state.completed) return;
    if (event.code === 'ArrowLeft') turn(-1);
    if (event.code === 'ArrowRight') turn(1);
    if (event.code === 'ArrowUp') move(1);
    if (event.code === 'ArrowDown') move(-1);
  });

  function turn(amount) {
    state.direction = (state.direction + amount + 4) % 4;
    mazeEvents.emit('playerMoved', snapshot('turn'));
    refresh(`Turned ${DIRECTIONS[state.direction].name}.`);
  }

  function move(amount) {
    const direction = DIRECTIONS[(state.direction + (amount < 0 ? 2 : 0)) % 4];
    const next = { x: state.x + direction.x, y: state.y + direction.y };
    if (isWall(next) || isBehindCheckpoint(next)) {
      mazeEvents.emit('collision', snapshot('blocked'));
      refresh(isBehindCheckpoint(next) ? 'The active checkpoint blocks the path behind you.' : 'Wall ahead.');
      return;
    }
    state.x = next.x; state.y = next.y;
    mazeEvents.emit('playerMoved', snapshot('move'));
    activateCheckpoint();
    if (state.x === goal.x && state.y === goal.y) {
      state.completed = true;
      mazeEvents.emit('goalReached', snapshot('goal'));
      refresh('Goal reached. Maze completed!');
      return;
    }
    refresh('Path clear.');
  }

  function activateCheckpoint() {
    const index = CHECKPOINTS.findIndex((point) => point.x === state.x && point.y === state.y);
    if (index > state.checkpoint) {
      state.checkpoint = index;
      mazeEvents.emit('checkpointReached', snapshot('checkpoint'));
    }
  }

  function isBehindCheckpoint(next) {
    if (state.checkpoint < 0) return false;
    return distances.get(key(next)) < CHECKPOINTS[state.checkpoint].distance;
  }

  function orientationQuery() { refresh(`Facing ${DIRECTIONS[state.direction].name}.`); }
  function restart() {
    state.x = start.x; state.y = start.y; state.direction = 1; state.checkpoint = -1; state.completed = false;
    mazeEvents.emit('playerMoved', snapshot('restart'));
    refresh('Maze restarted. Facing east.');
  }
  function snapshot(action) { return { action, x: state.x, y: state.y, facing: DIRECTIONS[state.direction].name, checkpoint: state.checkpoint + 1 }; }
  function refresh(message = 'Maze ready. Facing east.') {
    player.setPosition(state.x * TILE + TILE / 2, state.y * TILE + TILE / 2).setAngle(DIRECTIONS[state.direction].angle);
    document.querySelector('#position').textContent = `${state.x}, ${state.y}`;
    document.querySelector('#facing').textContent = DIRECTIONS[state.direction].name;
    document.querySelector('#checkpoint').textContent = state.checkpoint >= 0 ? state.checkpoint + 1 : 'None';
    document.querySelector('#event').textContent = message;
  }
}

function drawMaze(scene) {
  MAZE.forEach((row, y) => [...row].forEach((cell, x) => {
    const centerX = x * TILE + TILE / 2, centerY = y * TILE + TILE / 2;
    if (cell === '#') scene.add.rectangle(centerX, centerY, TILE, TILE, 0x25364d).setStrokeStyle(1, 0x405775);
    else scene.add.rectangle(centerX, centerY, TILE, TILE, 0x0d1b28).setStrokeStyle(1, 0x122b3d);
  }));
  CHECKPOINTS.forEach((point, index) => {
    scene.add.circle(point.x * TILE + TILE / 2, point.y * TILE + TILE / 2, 10, 0xf4c95d);
    scene.add.text(point.x * TILE + TILE / 2, point.y * TILE + TILE / 2, String(index + 1), { fontSize: '13px', color: '#071119', fontStyle: 'bold' }).setOrigin(.5);
  });
  scene.add.text(start.x * TILE + TILE / 2, start.y * TILE - 7, 'START', { fontSize: '10px', color: '#a8d4ff' }).setOrigin(.5, 1);
  scene.add.text(goal.x * TILE + TILE / 2, goal.y * TILE - 7, 'GOAL', { fontSize: '10px', color: '#ffb8aa' }).setOrigin(.5, 1);
}

function findTile(character) { for (let y = 0; y < MAZE.length; y++) { const x = MAZE[y].indexOf(character); if (x !== -1) return { x, y }; } throw new Error(`${character} missing from maze`); }
function isWall(point) { return point.y < 0 || point.y >= MAZE.length || point.x < 0 || point.x >= MAZE[0].length || MAZE[point.y][point.x] === '#'; }
function key(point) { return `${point.x},${point.y}`; }
function createDistanceMap(from) {
  const queue = [from], result = new Map([[key(from), 0]]);
  while (queue.length) {
    const current = queue.shift();
    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.x, y: current.y + direction.y }, nextKey = key(next);
      if (!isWall(next) && !result.has(nextKey)) { result.set(nextKey, result.get(key(current)) + 1); queue.push(next); }
    }
  }
  return result;
}

window.mazeEvents = mazeEvents;
