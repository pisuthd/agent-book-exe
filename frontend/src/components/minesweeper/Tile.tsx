import { useEffect, useState, type MouseEvent } from 'react';
import './Minesweeper.css';
import type { Tile as TileType, Coordinates } from './minesweeperReducer';

type TileProps = {
    coordinates: Coordinates;
    tile: TileType;
    gameEnded: boolean;
    mineCount: number;
    onMouseDown: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
    onClick: (coords: Coordinates) => void;
    onRightClick: (coords: Coordinates) => void;
};

const mineCountToClassName: Record<number, string> = {
    0: 'empty',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
};

function Tile({ coordinates, tile, gameEnded, mineCount, onMouseDown, onMouseUp, onClick, onRightClick }: TileProps) {
    const [causedGameEnd, setCausedGameEnd] = useState(false);

    useEffect(() => {
        if (!gameEnded) setCausedGameEnd(false);
    }, [gameEnded]);

    const handleClick = () => {
        onClick(coordinates);
        if (tile.isMine) setCausedGameEnd(true);
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        if (!gameEnded) {
            onRightClick(coordinates);
        }
    };

    let className = 'tile';
    if (tile.isMine) className += ' mine';
    else className += ` ${mineCountToClassName[mineCount] || 'empty'}`;

    if (tile.state === 'REVEALED') {
        className += ' revealed';
        if (causedGameEnd) className += ' caused-game-end';
        return <div className={className} />;
    } else {
        if (tile.state === 'FLAGGED') className += ' flagged';
        if (tile.state === 'QUESTION') className += ' question';
        if (gameEnded && tile.isMine) className += ' revealed';
        return (
            <div
                className={className}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onClick={gameEnded ? undefined : handleClick}
                onContextMenu={handleContextMenu}
            />
        );
    }
}

export default Tile;