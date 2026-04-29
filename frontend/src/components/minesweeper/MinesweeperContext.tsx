import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
    GameState,
    GameSettings,
    Coordinates,
} from './minesweeperReducer';
import type { GameAction } from './minesweeperReducer';
import { minesweeperReducer, initialState } from './minesweeperReducer';

type MinesweeperContextType = {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    generateGrid: (settings: GameSettings) => void;
    revealTile: (coords: Coordinates) => void;
    incrementTileState: (coords: Coordinates) => void;
    restart: () => void;
};

const MinesweeperContext = createContext<MinesweeperContextType | null>(null);

export function MinesweeperProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(minesweeperReducer, {
        ...initialState,
        grid: [], // Initialize empty grid
    });

    const generateGrid = (settings: GameSettings) => {
        dispatch({ type: 'GENERATE_GRID', payload: settings });
    };

    const revealTile = (coords: Coordinates) => {
        dispatch({ type: 'REVEAL_TILE', payload: coords });
    };

    const incrementTileState = (coords: Coordinates) => {
        dispatch({ type: 'INCREMENT_TILE_STATE', payload: coords });
    };

    const restart = () => {
        dispatch({ type: 'RESTART' });
    };

    return (
        <MinesweeperContext.Provider
            value={{
                state,
                dispatch,
                generateGrid,
                revealTile,
                incrementTileState,
                restart,
            }}
        >
            {children}
        </MinesweeperContext.Provider>
    );
}

export function useMinesweeper() {
    const context = useContext(MinesweeperContext);
    if (!context) {
        throw new Error('useMinesweeper must be used within a MinesweeperProvider');
    }
    return context;
}