import type { ReactNode } from 'react';
import './Minesweeper.css';

type DigitsDisplayProps = {
    digits: number;
    value: number;
};

const valueToClassName: Record<number, string> = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
};

function DigitsDisplay({ digits, value }: DigitsDisplayProps) {
    value = Math.min(Math.pow(10, digits) - 1, Math.max(-Math.pow(10, digits), value));
    const elements: ReactNode[] = [];

    for (let i = 0; i < digits; i++) {
        const digit = value % 10;
        const className = value < 0 ? 'minus' : valueToClassName[digit] || 'zero';
        elements.push(
            <div key={i} className={`digits ${className}`} />
        );
        value = Math.floor(value / 10);
    }

    elements.reverse();

    return <div className="digits-display">{elements}</div>;
}

export default DigitsDisplay;
