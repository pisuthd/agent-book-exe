import { useState } from 'react';
import { Modal, TitleBar, List } from '@react95/core';
import { Winmine1 } from '@react95/icons';
import { MinesweeperProvider } from './MinesweeperContext';
import Game from './Game';
import type { GameSettings } from './minesweeperReducer';

interface MinesweeperWindowProps {
    onClose: () => void;
}

const GAME_SETTINGS: Record<string, GameSettings> = {
    'Easy': { width: 9, height: 9, minesCount: 10 },
    'Medium': { width: 16, height: 16, minesCount: 40 },
    'Hard': { width: 30, height: 16, minesCount: 99 },
};

export function MinesweeperWindow({ onClose }: MinesweeperWindowProps) {
    const [currentSettings, setCurrentSettings] = useState<GameSettings>(GAME_SETTINGS['Medium']);

    const handleNewGame = (difficulty: string) => {
        setCurrentSettings(GAME_SETTINGS[difficulty]);
    };

    return (
        <Modal
            icon={<Winmine1 variant="32x32_4" />}
            title="Minesweeper"
            titleBarOptions={<TitleBar.Close onClick={onClose} />}
            menu={[{
                name: 'Game',
                list: (
                    <List width="200px">
                        <List.Item>
                            <List width="180px">
                                <List.Item onClick={() => handleNewGame('Easy')}>
                                    Easy (9×9)
                                </List.Item>
                                <List.Item onClick={() => handleNewGame('Medium')}>
                                    Medium (16×16)
                                </List.Item>
                                <List.Item onClick={() => handleNewGame('Hard')}>
                                    Hard (30×16)
                                </List.Item>
                            </List>
                            Change Mode
                        </List.Item>
                        <List.Divider />
                        <List.Item onClick={onClose}>
                            Exit
                        </List.Item>
                    </List>
                )
            }]}
            style={{
                left: 300,
                top: 80,
                width: 'auto',
            }}
        >
            <MinesweeperProvider>
                <Game settings={currentSettings} />
            </MinesweeperProvider>
        </Modal>
    );
}