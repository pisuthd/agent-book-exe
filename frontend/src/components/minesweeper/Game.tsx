import { useEffect, useState, type MouseEvent } from 'react';
import './Minesweeper.css';
import { useMinesweeper } from './MinesweeperContext';
import type { GameSettings } from './minesweeperReducer';
import Tile from './Tile';
import DigitsDisplay from './DigitsDisplay';
import Smiley from './Smiley';

type GameProps = {
    settings: GameSettings;
};

const calculateMineCount = (grid: { isMine: boolean }[][], x: number, y: number): number => {
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

function Game({ settings }: GameProps) {
    const { state, generateGrid, revealTile, incrementTileState, restart } = useMinesweeper();
    const [mouseDownOnTile, setMouseDownOnTile] = useState(false);
    const [timerStarted, setTimerStarted] = useState(-1);
    const [timeToDisplay, setTimeToDisplay] = useState(0);

    useEffect(() => {
        generateGrid(settings);
    }, [settings]);

    useEffect(() => {
        if (timerStarted >= 0) {
            const interval = setInterval(() => {
                setTimeToDisplay(Math.floor((Date.now() - timerStarted) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timerStarted]);

    useEffect(() => {
        if (state.revealedCount === 0) setTimerStarted(-1);
        else if (state.revealedCount > 0 && timerStarted < 0) setTimerStarted(Date.now());
    }, [state.revealedCount]);

    useEffect(() => {
        if (state.gameEnded) {
            setTimerStarted(-1);
        }
    }, [state.gameEnded]);

    const handleRestart = () => {
        restart();
        generateGrid(settings);
    };

    const getSmileyState = () => {
        if (state.gameEnded) {
            return state.won ? 'WIN' : 'LOSE';
        }
        return mouseDownOnTile ? 'SCARED' : 'NORMAL';
    };

    return (
        <div className="minesweeper-game">
            <div className="game-status">
                <DigitsDisplay digits={3} value={settings.minesCount - state.flagCount} />
                <Smiley state={getSmileyState()} onClick={handleRestart} />
                <DigitsDisplay digits={3} value={timeToDisplay} />
            </div>
            <div className="inner-border">
                {state.grid.map((row, y) => (
                    <div key={`row-${y}`} className="row">
                        {row.map((tile, x) => (
                            <Tile
                                key={`${y}-${x}`}
                                coordinates={{ x, y }}
                                tile={tile}
                                gameEnded={state.gameEnded}
                                mineCount={tile.isMine ? -1 : calculateMineCount(state.grid, x, y)}
                                onMouseDown={(e: MouseEvent) => e.button === 0 && setMouseDownOnTile(true)}
                                onMouseUp={(e: MouseEvent) => e.button === 0 && setMouseDownOnTile(false)}
                                onClick={revealTile}
                                onRightClick={incrementTileState}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Game;