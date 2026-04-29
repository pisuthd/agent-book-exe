export type TileState = 'HIDDEN' | 'FLAGGED' | 'QUESTION' | 'REVEALED';

export type Tile = {
    state: TileState;
    isMine: boolean;
};

export type GameSettings = {
    width: number;
    height: number;
    minesCount: number;
};

export type Coordinates = {
    x: number;
    y: number;
};

export type GameState = {
    grid: Tile[][];
    settings: GameSettings;
    gameEnded: boolean;
    won: boolean;
    flagCount: number;
    revealedCount: number;
};

export type GameAction =
    | { type: 'GENERATE_GRID'; payload: GameSettings }
    | { type: 'REVEAL_TILE'; payload: Coordinates }
    | { type: 'INCREMENT_TILE_STATE'; payload: Coordinates }
    | { type: 'RESTART' };

const DEFAULT_SETTINGS: GameSettings = {
    width: 9,
    height: 9,
    minesCount: 10,
};

export const initialState: GameState = {
    grid: [],
    settings: DEFAULT_SETTINGS,
    gameEnded: false,
    won: false,
    flagCount: 0,
    revealedCount: 0,
};

const calculateMineCount = (grid: Tile[][], coords: Coordinates): number => {
    const { x, y } = coords;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            const newX = x + dx;
            const newY = y + dy;
            if (
                newY >= 0 && newY < grid.length &&
                newX >= 0 && newX < grid[0].length &&
                grid[newY][newX].isMine
            ) count++;
        }
    }
    return count;
};

const countRevealed = (grid: Tile[][]) => grid.flat().filter(x => x.state === 'REVEALED').length;
const countFlagged = (grid: Tile[][]) => grid.flat().filter(x => x.state === 'FLAGGED').length;

export function minesweeperReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'GENERATE_GRID': {
            const { width, height, minesCount } = action.payload;
            const newGrid: Tile[][] = [];
            let tiles: Coordinates[] = [];

            for (let y = 0; y < height; y++) {
                newGrid.push([]);
                for (let x = 0; x < width; x++) {
                    tiles.push({ x, y });
                    newGrid[y].push({ state: 'HIDDEN', isMine: false });
                }
            }

            for (let i = 0; i < minesCount; i++) {
                const j = Math.floor(Math.random() * tiles.length);
                const { x, y } = tiles[j];
                newGrid[y][x].isMine = true;
                tiles = [...tiles.slice(0, j), ...tiles.slice(j + 1)];
            }

            return {
                ...state,
                grid: newGrid,
                settings: action.payload,
                gameEnded: false,
                won: false,
                flagCount: 0,
                revealedCount: 0,
            };
        }

        case 'REVEAL_TILE': {
            const { x, y } = action.payload;
            if (y < 0 || y >= state.grid.length) return state;
            if (x < 0 || x >= state.grid[0].length) return state;
            if (state.gameEnded) return state;

            const newGrid = state.grid.map(row => row.map(tile => ({ ...tile })));
            const tile = newGrid[y][x];

            // First reveal loss prevention
            if (state.revealedCount === 0 && tile.isMine) {
                newGrid[y][x].isMine = false;
                for (let gy = 0; gy < newGrid.length; gy++) {
                    let relocated = false;
                    for (let gx = 0; gx < newGrid[gy].length; gx++) {
                        if (newGrid[gy][gx].isMine || (gy === y && gx === x)) continue;
                        newGrid[gy][gx].isMine = true;
                        relocated = true;
                        break;
                    }
                    if (relocated) break;
                }
            }

            const stack = [{ x, y }] as Coordinates[];
            let revealed = 0;
            let hitMine = false;

            while (stack.length) {
                const current = stack.pop()!;
                const { x: cx, y: cy } = current;

                if (cy < 0 || cy >= newGrid.length) continue;
                if (cx < 0 || cx >= newGrid[0].length) continue;

                const currentTile = newGrid[cy][cx];
                if (currentTile.state === 'REVEALED') continue;

                newGrid[cy][cx].state = 'REVEALED';
                revealed++;

                if (currentTile.isMine) {
                    hitMine = true;
                    continue;
                }

                const mineCount = calculateMineCount(newGrid, { x: cx, y: cy });
                if (mineCount === 0) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            stack.push({ x: cx + dx, y: cy + dy });
                        }
                    }
                }
            }

            const totalRevealed = countRevealed(newGrid);
            const totalFlagged = countFlagged(newGrid);
            const totalTiles = state.settings.width * state.settings.height;
            const won = !hitMine && totalRevealed + state.settings.minesCount === totalTiles;

            return {
                ...state,
                grid: newGrid,
                gameEnded: hitMine || won,
                won,
                flagCount: totalFlagged,
                revealedCount: totalRevealed,
            };
        }

        case 'INCREMENT_TILE_STATE': {
            const { x, y } = action.payload;
            if (y < 0 || y >= state.grid.length) return state;
            if (x < 0 || x >= state.grid[0].length) return state;

            const tile = state.grid[y][x];
            if (tile.state === 'REVEALED') return state;

            const newGrid = state.grid.map(row => row.map(t => ({ ...t })));
            const states: TileState[] = ['HIDDEN', 'FLAGGED', 'QUESTION'];
            const currState = states.indexOf(tile.state);

            if (currState >= 0) {
                newGrid[y][x].state = states[(currState + 1) % states.length];
            }

            return {
                ...state,
                grid: newGrid,
                flagCount: countFlagged(newGrid),
            };
        }

        case 'RESTART': {
            return {
                ...initialState,
                settings: state.settings,
            };
        }

        default:
            return state;
    }
}