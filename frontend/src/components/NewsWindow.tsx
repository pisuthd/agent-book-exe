import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset, RadioButton, TitleBar } from '@react95/core';
import { CURRENT_PRICE, PRICE_CHANGE_24H, newsEvents } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';
import type { NewsDirection } from '../types';

interface NewsWindowProps {
  onClose: () => void;
}

const directionArrow = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '▲';
    case 'bearish': return '▼';
    case 'neutral': return '─';
    case 'volatility': return '⇅';
  }
};

const directionColor = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '#008000';
    case 'bearish': return '#cc0000';
    case 'neutral': return '#888';
    case 'volatility': return '#cc8800';
  }
};

export function NewsWindow({ onClose }: NewsWindowProps) {
  const { fs } = useAppSettings();
  const [headline, setHeadline] = useState('');
  const [direction, setDirection] = useState<NewsDirection>('bullish');
  const [magnitude, setMagnitude] = useState('3.5');
  const [duration, setDuration] = useState('30');

  return (
    <Modal
      id="news"
      icon={<span>📰</span>}
      title="News & Price Control"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 140, top: 50, width: 560, height: 500 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto' }}>
        {/* Live Price */}
        <Frame style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
          padding: '6px 8px',
          background: '#ffffcc',
          border: '1px solid #cccc00',
        }}>
          <span style={{ fontSize: fs(12), fontWeight: 'bold' }}>🔴 LIVE PRICE:</span>
          <span style={{ fontSize: fs(16), fontWeight: 'bold' }}>${CURRENT_PRICE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span style={{ fontSize: fs(12), color: PRICE_CHANGE_24H >= 0 ? '#008000' : '#cc0000' }}>
            {PRICE_CHANGE_24H >= 0 ? '+' : ''}{PRICE_CHANGE_24H}%
          </span>
          <span style={{ fontSize: fs(11), color: '#888' }}>Last tick: 1s ago</span>
        </Frame>

        {/* Create News Event */}
        <Fieldset legend="Create News Event" style={{ marginBottom: 10 }}>
          <Frame style={{ marginBottom: 6 }}>
            <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Headline:</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Bitcoin ETF sees record $1B daily inflow"
              style={{ width: '100%' }}
            />
          </Frame>

          <Frame style={{ display: 'flex', gap: 16, marginBottom: 6, alignItems: 'center' }}>
            <Frame>
              <label style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>Direction:</label>
              <Frame style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: fs(12), cursor: 'pointer' }}>
                  <RadioButton checked={direction === 'bullish'} onChange={() => setDirection('bullish')} />
                  Bullish
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: fs(12), cursor: 'pointer' }}>
                  <RadioButton checked={direction === 'bearish'} onChange={() => setDirection('bearish')} />
                  Bearish
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: fs(12), cursor: 'pointer' }}>
                  <RadioButton checked={direction === 'volatility'} onChange={() => setDirection('volatility')} />
                  Volatility
                </label>
              </Frame>
            </Frame>
          </Frame>

          <Frame style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Frame style={{ flex: 1 }}>
              <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Magnitude (%):</label>
              <Input value={magnitude} onChange={(e) => setMagnitude(e.target.value)} style={{ width: '100%' }} />
            </Frame>
            <Frame style={{ flex: 1 }}>
              <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Duration (seconds):</label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%' }} />
            </Frame>
          </Frame>

          <Frame style={{ display: 'flex', gap: 4 }}>
            <Button style={{ fontSize: fs(11) }}>📰 Publish News</Button>
            <Button style={{ fontSize: fs(11) }}>🔀 Random Walk</Button>
            <Button style={{ fontSize: fs(11) }}>💥 Flash Crash</Button>
          </Frame>
        </Fieldset>

        {/* Event History */}
        <Fieldset legend="Event History" style={{ marginBottom: 10 }}>
          <Frame style={{ flexDirection: 'column', gap: 8 }}>
            {newsEvents.map((event, i) => (
              <Frame key={i} style={{ paddingBottom: 8, borderBottom: i < newsEvents.length - 1 ? '1px solid #eee' : 'none' }}>
                <Frame style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>📰</span>
                  <span style={{ fontSize: fs(11), color: '#888' }}>{event.timestamp}</span>
                  <strong style={{ fontSize: fs(12) }}>"{event.headline}"</strong>
                  <span style={{
                    color: directionColor(event.direction),
                    fontWeight: 'bold',
                    fontSize: fs(12),
                  }}>
                    {event.magnitudePct >= 0 ? '+' : ''}{event.magnitudePct}% {directionArrow(event.direction)}
                  </span>
                </Frame>
                <Frame style={{ paddingLeft: 20, flexDirection: 'column', gap: 1 }}>
                  {event.reactions.map((r, j) => (
                    <span key={j} style={{ fontSize: fs(11), color: '#666' }}>
                      → {r.agent}: {r.reaction}
                    </span>
                  ))}
                </Frame>
              </Frame>
            ))}
          </Frame>
        </Fieldset>

        {/* Quick Presets */}
        <Fieldset legend="Quick Presets">
          <Frame style={{ display: 'flex', gap: 4 }}>
            <Button style={{ color: '#008000', fontSize: fs(11) }}>📈 Pump +5%</Button>
            <Button style={{ color: '#cc0000', fontSize: fs(11) }}>📉 Dump -5%</Button>
            <Button style={{ color: '#cc8800', fontSize: fs(11) }}>🌊 Volatility</Button>
            <Button style={{ color: '#cc0000', fontWeight: 'bold', fontSize: fs(11) }}>⚡ Flash Crash</Button>
          </Frame>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}
