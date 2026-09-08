# EchoMaze Foundation
## Controls

- Up arrow: move forward
- Down arrow: move backward
- Left/right arrow: rotate 90 degrees
- R: restart at the start, facing east
- I, or Up + Down held together: orientation query

## Frozen implementation decisions

The supplied concept drawing did not contain machine-readable grid coordinates. This implementation turns it into a single-width, grid-based maze. The top entrance is the start, facing east; the bottom exit is the goal. The six numbered points are checkpoints. Reaching a checkpoint prevents travel to cells earlier than that checkpoint.

## Event contract for the audio layer

`window.mazeEvents` is a Phaser EventEmitter. Subscribe with `window.mazeEvents.on(eventName, callback)`.

| Event | When emitted | Payload |
| --- | --- | --- |
| `playerMoved` | successful movement, rotation, or restart | `{ action, x, y, facing, checkpoint }` |
| `collision` | wall or active checkpoint blocks movement | `{ action, x, y, facing, checkpoint }` |
| `checkpointReached` | player enters a new checkpoint | `{ action, x, y, facing, checkpoint }` |
| `goalReached` | player reaches the goal | `{ action, x, y, facing, checkpoint }` |

## Known limitation

The current checkpoint rule uses distance from the start. It is correct for this deliberately single-route maze. If the team later switches to a maze with loops, it can be replaced with  explicit checkpoint-gate edges.
