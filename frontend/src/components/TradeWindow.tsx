import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset } from '@react95/core';
import { asks, bids, recentTrades, CURRENT_PRICE, PRICE_CHANGE_24H } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';

interface TradeWindowProps {
  onClose: () => void;
}

export function TradeWindow({ onClose }: TradeWindowProps) {
  const { fs } = useAppSettings();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('0.50');
  const [limitPrice, setLimitPrice] = useState(CURRENT_PRICE.toString());

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(limitPrice) || 0;
  const estTotal = amountNum * priceNum;

  const maxSize = Math.max(...asks.map((a) => a.size), ...bids.map((b) => b.size));

  return (
    <Modal
      id="trade"
      icon={<span>📊</span>}
      title="BTC/USDT"
      style={{ left: 80, top: 30, width: 700, height: 520 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto' }}>
        {/* Price Header */}
        <Frame style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid #ccc',
        }}>
          <strong style={{ fontSize: fs(14) }}>BTC/USDT</strong>
          <span style={{ fontSize: fs(18), fontWeight: 'bold' }}>${CURRENT_PRICE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span style={{ fontSize: fs(12), color: PRICE_CHANGE_24H >= 0 ? '#008000' : '#cc0000' }}>
            {PRICE_CHANGE_24H >= 0 ? '+' : ''}{PRICE_CHANGE_24H}% (24h)
          </span>
        </Frame>

        {/* Orderbook + Trade Panel */}
        <Frame style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {/* Orderbook */}
          <Frame style={{ flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(11) }}>
              <thead>
                <tr style={{ background: '#c0c0c0' }}>
                  <th style={{ textAlign: 'right', padding: '2px 6px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '2px 6px' }}>Size</th>
                  <th style={{ textAlign: 'left', padding: '2px 6px' }}>Agent</th>
                  <th style={{ padding: '2px 6px' }}></th>
                </tr>
              </thead>
              <tbody>
                {[...asks].reverse().map((entry, i) => {
                  const barW = (entry.size / maxSize) * 100;
                  return (
                    <tr key={`ask-${i}`} style={{ background: '#fff0f0' }}>
                      <td style={{ textAlign: 'right', padding: '1px 6px', color: '#cc0000' }}>{entry.price.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '1px 6px' }}>{entry.size.toFixed(2)}</td>
                      <td style={{ padding: '1px 6px' }}>{entry.agent}</td>
                      <td style={{ padding: '1px 6px', width: 40 }}>
                        <div style={{ background: '#ffcccc', height: 8, width: `${barW}%`, borderRadius: 1 }} />
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#e0e0e0' }}>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2px 6px', fontSize: fs(10), letterSpacing: 2 }}>
                    ═══ SPREAD ═══
                  </td>
                </tr>
                {bids.map((entry, i) => {
                  const barW = (entry.size / maxSize) * 100;
                  return (
                    <tr key={`bid-${i}`} style={{ background: '#f0fff0' }}>
                      <td style={{ textAlign: 'right', padding: '1px 6px', color: '#008000' }}>{entry.price.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '1px 6px' }}>{entry.size.toFixed(2)}</td>
                      <td style={{ padding: '1px 6px' }}>{entry.agent}</td>
                      <td style={{ padding: '1px 6px', width: 40 }}>
                        <div style={{ background: '#ccffcc', height: 8, width: `${barW}%`, borderRadius: 1 }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Frame>

          {/* Trade Execution Panel */}
          <Frame style={{ width: 240 }}>
            <Frame style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <Button
                onClick={() => setSide('BUY')}
                style={{
                  flex: 1,
                  background: side === 'BUY' ? '#008000' : undefined,
                  color: side === 'BUY' ? 'white' : undefined,
                  fontWeight: 'bold',
                  fontSize: fs(12),
                }}
              >
                BUY
              </Button>
              <Button
                onClick={() => setSide('SELL')}
                style={{
                  flex: 1,
                  background: side === 'SELL' ? '#cc0000' : undefined,
                  color: side === 'SELL' ? 'white' : undefined,
                  fontWeight: 'bold',
                  fontSize: fs(12),
                }}
              >
                SELL
              </Button>
            </Frame>

            <Frame style={{ marginBottom: 8 }}>
              <label style={{ fontSize: fs(11) }}>Amount (BTC):</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%' }}
              />
            </Frame>

            <Frame style={{ marginBottom: 8 }}>
              <label style={{ fontSize: fs(11) }}>Limit Price:</label>
              <Input
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                style={{ width: '100%' }}
              />
            </Frame>

            <Fieldset legend="Estimates" style={{ marginBottom: 8 }}>
              <table style={{ fontSize: fs(11), width: '100%' }}>
                <tbody>
                  <tr>
                    <td>Est. Total:</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ~{estTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
                    </td>
                  </tr>
                  <tr>
                    <td>Est. Slippage:</td>
                    <td style={{ textAlign: 'right' }}>0.05%</td>
                  </tr>
                </tbody>
              </table>
            </Fieldset>

            <Fieldset legend="Fill Preview" style={{ marginBottom: 8 }}>
              <Frame style={{ fontSize: fs(10), flexDirection: 'column', gap: 2 }}>
                <span>0.20 BTC @ 64,032 (Vitalik)</span>
                <span>0.15 BTC @ 64,000 (Hal)</span>
                <span>0.15 BTC @ 63,968 (Vitalik)</span>
              </Frame>
            </Fieldset>

            <Button
              style={{
                width: '100%',
                background: side === 'BUY' ? '#008000' : '#cc0000',
                color: 'white',
                fontWeight: 'bold',
                fontSize: fs(14),
              }}
            >
              EXECUTE {side}
            </Button>
          </Frame>
        </Frame>

        {/* Recent Trades */}
        <Fieldset legend="Recent Trades">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(11) }}>
            <thead>
              <tr style={{ background: '#c0c0c0' }}>
                <th style={{ textAlign: 'right', padding: '2px 8px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '2px 8px' }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '2px 8px' }}>Side</th>
                <th style={{ textAlign: 'right', padding: '2px 8px' }}>Time</th>
                <th style={{ textAlign: 'left', padding: '2px 8px' }}>Filled By</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ textAlign: 'right', padding: '2px 8px' }}>{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', padding: '2px 8px' }}>{trade.amount.toFixed(2)}</td>
                  <td style={{
                    textAlign: 'center',
                    padding: '2px 8px',
                    color: trade.side === 'BUY' ? '#008000' : '#cc0000',
                    fontWeight: 'bold',
                  }}>
                    {trade.side}
                  </td>
                  <td style={{ textAlign: 'right', padding: '2px 8px' }}>{trade.time}</td>
                  <td style={{ padding: '2px 8px' }}>{trade.filledBy.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}
