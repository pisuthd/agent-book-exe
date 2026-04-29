import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset, TitleBar } from '@react95/core';
import { asks, bids, recentTrades, CURRENT_PRICE, PRICE_CHANGE_24H } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';

interface OrderbookEntry {
  price: number;
  size: number;
  agent: string;
  totalUsdt?: number;
}

interface GroupedEntry {
  price: number;
  entries: { size: number; agent: string }[];
  totalSize: number;
  totalUsdt: number;
}

function groupByPrice(entries: OrderbookEntry[]): GroupedEntry[] {
  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.price]) {
      acc[entry.price] = { price: entry.price, entries: [], totalSize: 0, totalUsdt: 0 };
    }
    acc[entry.price].entries.push({ size: entry.size, agent: entry.agent });
    acc[entry.price].totalSize += entry.size;
    acc[entry.price].totalUsdt += entry.size * entry.price;
    return acc;
  }, {} as Record<number, GroupedEntry>);
  
  return Object.values(grouped).sort((a, b) => b.price - a.price);
}

interface TradeWindowProps {
  onClose: () => void;
}

export function TradeWindow({ onClose }: TradeWindowProps) {
  const { fs } = useAppSettings();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('0.50');
  const [limitPrice, setLimitPrice] = useState(CURRENT_PRICE.toString());
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(limitPrice) || 0;
  const estTotal = amountNum * priceNum;

  const groupedAsks = groupByPrice(asks);
  const groupedBids = groupByPrice(bids);
  
  const totalAskSize = asks.reduce((sum, a) => sum + a.size, 0);
  const totalBidSize = bids.reduce((sum, b) => sum + b.size, 0);
  const totalLiquidity = totalAskSize + totalBidSize;

  const handlePriceClick = (price: number) => {
    setLimitPrice(price.toString());
  };

  return (
    <Modal
      id="trade"
      icon={<span>📊</span>}
      title="BTC/USDT"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{
        left: 20,
        top: 10,
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 60px)',
      }}
    >
      <Frame style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#c0c0c0' }}>
        {/* Price Header Bar */}
        <Frame style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          background: '#000080',
          color: 'white',
          gap: 20,
        }}>
          <span style={{ fontSize: fs(14), fontWeight: 'bold' }}>BTC/USDT</span>
          <span style={{ fontSize: fs(20), fontWeight: 'bold' }}>${CURRENT_PRICE.toLocaleString()}</span>
          <span style={{ fontSize: fs(12), color: PRICE_CHANGE_24H >= 0 ? '#00ff00' : '#ff6666' }}>
            {PRICE_CHANGE_24H >= 0 ? '+' : ''}{PRICE_CHANGE_24H}%
          </span>
          <Frame style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: fs(11) }}>24h Vol: <strong>1,234.56 BTC</strong></span>
          <span style={{ fontSize: fs(11) }}>High: <strong>$65,000</strong></span>
          <span style={{ fontSize: fs(11) }}>Low: <strong>$63,500</strong></span>
          <span style={{ fontSize: fs(11) }}>Spread: <strong>$32 (0.05%)</strong></span>
        </Frame>

        {/* Main Trading Area */}
        <Frame style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Order Book - Left Panel */}
          <Frame style={{ flex: 1.2, flexDirection: 'column', borderRight: '2px solid', borderColor: '#808080' }}>
            {/* Asks (Sells) - Top */}
            <Frame style={{ flex: 1, flexDirection: 'column', padding: 4 }}>
              <Frame style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px', 
                background: '#808080', 
                color: 'white', 
                fontSize: fs(12), 
                fontWeight: 'bold',
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}>
                <span>Asks ({totalAskSize.toFixed(4)} BTC)</span>
                <span style={{ color: '#ff8888' }}>SELL</span>
              </Frame>
              <Frame style={{ flex: 1, overflow: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(11) }}>
                  <thead>
                    <tr style={{ background: '#c0c0c0' }}>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Size</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Total</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...groupedAsks].reverse().map((entry, i) => {
                      const cumulative = groupedAsks.slice(groupedAsks.length - i - 1).reduce((sum, g) => sum + g.totalSize, 0) + entry.totalSize;
                      const depthPct = (cumulative / totalLiquidity) * 100;
                      return (
                        <tr 
                          key={`ask-${i}`} 
                          onClick={() => handlePriceClick(entry.price)}
                          style={{ cursor: 'pointer', background: `linear-gradient(to left, rgba(255,0,0,${depthPct/300}), transparent)` }}
                        >
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '3px 6px', 
                            color: '#cc0000',
                            fontWeight: 'bold',
                          }}>
                            {entry.price.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', padding: '3px 6px' }}>{entry.totalSize.toFixed(4)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 6px', color: '#888' }}>{entry.totalUsdt.toLocaleString()}</td>
                          <td style={{ textAlign: 'left', padding: '3px 6px', color: '#666' }}>
                            {entry.entries.map(e => e.agent).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Frame>
            </Frame>

            {/* Spread / Mid Price */}
            <Frame style={{
              padding: '8px 12px',
              background: '#e0e0e0',
              borderTop: '2px solid #808080',
              borderBottom: '2px solid #808080',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: fs(12) }}>Mid Price: <strong>${CURRENT_PRICE.toLocaleString()}</strong></span>
              <span style={{ fontSize: fs(12), fontWeight: 'bold', color: '#008000' }}>SPREAD: $32</span>
            </Frame>

            {/* Bids (Buys) - Bottom */}
            <Frame style={{ flex: 1, flexDirection: 'column', padding: 4 }}>
              <Frame style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px', 
                background: '#808080', 
                color: 'white', 
                fontSize: fs(12), 
                fontWeight: 'bold',
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}>
                <span>Bids ({totalBidSize.toFixed(4)} BTC)</span>
                <span style={{ color: '#88ff88' }}>BUY</span>
              </Frame>
              <Frame style={{ flex: 1, overflow: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(11) }}>
                  <thead>
                    <tr style={{ background: '#c0c0c0' }}>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Size</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Total</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBids.map((entry, i) => {
                      const cumulative = groupedBids.slice(0, i + 1).reduce((sum, g) => sum + g.totalSize, 0);
                      const depthPct = (cumulative / totalLiquidity) * 100;
                      return (
                        <tr 
                          key={`bid-${i}`} 
                          onClick={() => handlePriceClick(entry.price)}
                          style={{ cursor: 'pointer', background: `linear-gradient(to left, rgba(0,128,0,${depthPct/300}), transparent)` }}
                        >
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '3px 6px', 
                            color: '#008000',
                            fontWeight: 'bold',
                          }}>
                            {entry.price.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', padding: '3px 6px' }}>{entry.totalSize.toFixed(4)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 6px', color: '#888' }}>{entry.totalUsdt.toLocaleString()}</td>
                          <td style={{ textAlign: 'left', padding: '3px 6px', color: '#666' }}>
                            {entry.entries.map(e => e.agent).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Frame>
            </Frame>
          </Frame>

          {/* Trade Panel - Right Panel */}
          <Frame style={{ width: 340, flexDirection: 'column', padding: 8 }}>
            {/* Order Type Toggle */}
            <Frame style={{ display: 'flex', marginBottom: 8 }}>
              <Button
                onClick={() => setOrderType('limit')}
                style={{
                  flex: 1,
                  background: orderType === 'limit' ? '#000080' : '#c0c0c0',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: fs(11),
                  padding: '6px 0',
                }}
              >
                Limit
              </Button>
              <Button
                onClick={() => setOrderType('market')}
                style={{
                  flex: 1,
                  background: orderType === 'market' ? '#000080' : '#c0c0c0',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: fs(11),
                  padding: '6px 0',
                }}
              >
                Market
              </Button>
            </Frame>

            {/* BUY/SELL Toggle */}
            <Frame style={{ display: 'flex', marginBottom: 8 }}>
              <Button
                onClick={() => setSide('BUY')}
                style={{
                  flex: 1,
                  background: side === 'BUY' ? '#008000' : '#c0c0c0',
                  color: side === 'BUY' ? 'white' : 'black',
                  fontWeight: 'bold',
                  padding: '10px 0',
                  borderTop: '2px solid white',
                  borderLeft: '2px solid white',
                  borderRight: '2px solid #404040',
                  borderBottom: side === 'BUY' ? 'none' : '2px solid #404040',
                }}
              >
                BUY
              </Button>
              <Button
                onClick={() => setSide('SELL')}
                style={{
                  flex: 1,
                  background: side === 'SELL' ? '#cc0000' : '#c0c0c0',
                  color: side === 'SELL' ? 'white' : 'black',
                  fontWeight: 'bold',
                  padding: '10px 0',
                  borderTop: '2px solid white',
                  borderLeft: '2px solid white',
                  borderRight: '2px solid #404040',
                  borderBottom: side === 'SELL' ? 'none' : '2px solid #404040',
                }}
              >
                SELL
              </Button>
            </Frame>

            {/* Amount Input */}
            <Frame style={{ flexDirection: 'column', marginBottom: 8 }}>
              <label style={{ fontSize: fs(11), fontWeight: 'bold', marginBottom: 4 }}>Amount (BTC)</label>
              <Frame style={{ 
                background: 'white', 
                padding: '6px 8px',
                borderTop: '2px solid #404040',
                borderLeft: '2px solid #404040',
                borderRight: '2px solid white',
                borderBottom: '2px solid white',
              }}>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', border: 'none', fontSize: fs(14) }}
                />
              </Frame>
            </Frame>

            {/* Price Input - only for limit orders */}
            {orderType === 'limit' && (
              <Frame style={{ flexDirection: 'column', marginBottom: 8 }}>
                <label style={{ fontSize: fs(11), fontWeight: 'bold', marginBottom: 4 }}>Price (USDT)</label>
                <Frame style={{ 
                  background: 'white', 
                  padding: '6px 8px',
                  borderTop: '2px solid #404040',
                  borderLeft: '2px solid #404040',
                  borderRight: '2px solid white',
                  borderBottom: '2px solid white',
                }}>
                  <Input
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    style={{ width: '100%', border: 'none', fontSize: fs(14) }}
                  />
                </Frame>
              </Frame>
            )}

            {/* Order Summary */}
            <Fieldset legend="Order Summary" style={{ marginBottom: 8, fontSize: fs(11) }}>
              <Frame style={{ flexDirection: 'column', gap: 4 }}>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Est. Total:</span>
                  <span style={{ fontWeight: 'bold' }}>{estTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
                </Frame>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fee (0.1%):</span>
                  <span>{(estTotal * 0.001).toFixed(4)} USDT</span>
                </Frame>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Est. Slippage:</span>
                  <span>~0.02%</span>
                </Frame>
              </Frame>
            </Fieldset>

            {/* Execute Button */}
            <Button
              style={{
                width: '100%',
                background: side === 'BUY' ? '#008000' : '#cc0000',
                color: 'white',
                fontWeight: 'bold',
                fontSize: fs(16),
                padding: '14px 0',
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}
            >
              {orderType === 'market' ? 'MARKET BUY' : `BUY BTC`}
            </Button>

            <Frame style={{ height: 1, background: '#808080', margin: '12px 0' }} />

            {/* Balance Info */}
            <Fieldset legend="Your Balance" style={{ marginBottom: 8, fontSize: fs(11) }}>
              <Frame style={{ flexDirection: 'column', gap: 4 }}>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>USDT:</span>
                  <span style={{ fontWeight: 'bold' }}>10,000.00</span>
                </Frame>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>BTC:</span>
                  <span style={{ fontWeight: 'bold' }}>1.2345</span>
                </Frame>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Open Orders:</span>
                  <span>3</span>
                </Frame>
              </Frame>
            </Fieldset>

            {/* Recent Trades */}
            <Frame style={{ flex: 1, flexDirection: 'column' }}>
              <Frame style={{ 
                padding: '4px 8px', 
                background: '#808080', 
                color: 'white', 
                fontSize: fs(12), 
                fontWeight: 'bold',
                marginBottom: 4,
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}>
                Recent Trades
              </Frame>
              <Frame style={{ flex: 1, overflow: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(10) }}>
                  <thead>
                    <tr style={{ background: '#c0c0c0' }}>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Size</th>
                      <th style={{ textAlign: 'center', padding: '2px 4px' }}>Side</th>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '2px 4px',
                          color: trade.side === 'BUY' ? '#008000' : '#cc0000',
                          fontWeight: 'bold'
                        }}>
                          {trade.price.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', padding: '2px 4px' }}>{trade.amount.toFixed(4)}</td>
                        <td style={{ 
                          textAlign: 'center', 
                          padding: '2px 4px',
                          color: trade.side === 'BUY' ? '#008000' : '#cc0000',
                          fontSize: fs(9)
                        }}>
                          {trade.side}
                        </td>
                        <td style={{ textAlign: 'right', padding: '2px 4px', color: '#888' }}>{trade.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Frame>
            </Frame>
          </Frame>
        </Frame>
      </Frame>
    </Modal>
  );
}