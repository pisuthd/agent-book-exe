import './Minesweeper.css';

type SmileyProps = {
    state: 'NORMAL' | 'SCARED' | 'WIN' | 'LOSE';
    onClick: () => void;
};

const stateToClassName: Record<SmileyProps['state'], string> = {
    'NORMAL': '',
    'LOSE': 'lose',
    'SCARED': 'scared',
    'WIN': 'win'
};

function Smiley({ state, onClick }: SmileyProps) {
    const className = `smiley ${stateToClassName[state]}`;
    return <div className={className} onClick={onClick} />;
}

export default Smiley;