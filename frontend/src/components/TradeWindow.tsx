import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset, TitleBar } from '@react95/core';
import { useEnsName } from 'wagmi';
import { useAppSettings } from '../context/AppSettingsContext';
import { useMarketData } from '../hooks/useMarketData';
import { useTokenBalances } from '../hooks/useTokens';
import { useOrders } from '../hooks/useOrders';
import { useSettleTrade } from '../hooks/useSettleTrade';
import { useTrades, formatTradeTime, useTradeStats } from '../hooks/useTrades';
import type { NewsDirection } from '../types';

const directionColor = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '#008000';
    case 'bearish': return '#cc0000';
    case 'neutral': return '#888';
    case 'volatility': return '#cc8800';
  }
};

const directionArrow = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '▲';
    case 'bearish': return '▼';
    case 'neutral': return '─';
    case 'volatility': return '⇅';
  }
};

interface TradeWindowProps {
  onClose: () => void;
}

// Resolve ENS for an address
function EnsName({ address }: { address: string }) {

  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 11155111,
  });

  const display = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;
  return <span>{display}</span>;
}

// Format multiple addresses with ENS (filter duplicates)
function AgentAddresses({ addresses }: { addresses: string[] }) {
  // Filter out duplicate addresses
  const uniqueAddresses = [...new Set(addresses)];
  
  return (
    <>
      {uniqueAddresses.map((addr, idx) => (
        <span key={addr}>
          <EnsName address={addr} />
          {idx < uniqueAddresses.length - 1 && ', '}
        </span>
      ))}
    </>
  );
}

export function TradeWindow({ onClose }: TradeWindowProps) {
  const { fs } = useAppSettings();
  const { pair } = useMarketData();
  const { balances, isConnected, refetchAll } = useTokenBalances();
  const { aggregated, loading, error, refetch } = useOrders();
  const { settleTrade, loading: settling } = useSettleTrade();
  const { trades, loading: tradesLoading, refetch: refetchTrades } = useTrades();
  const { stats, refetch: refetchStats } = useTradeStats();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('0.01');
  const [limitPrice, setLimitPrice] = useState(pair?.price?.toString() || '95000');
  const [bottomTab, setBottomTab] = useState<'trades' | 'news'>('trades');
  const [settleStatus, setSettleStatus] = useState<string | null>(null);

  const currentPrice = pair?.price || 95000;
  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(limitPrice) || 0;
  const estTotal = amountNum * priceNum;

  const groupedAsks = aggregated.asks;
  const groupedBids = aggregated.bids;

  const totalAskSize = groupedAsks.reduce((sum, a) => sum + a.totalSize, 0);
  const totalBidSize = groupedBids.reduce((sum, b) => sum + b.totalSize, 0);
  const totalLiquidity = totalAskSize + totalBidSize;
 
  const handlePriceClick = (price: number) => {
    setLimitPrice(price.toString());
  };

  const handleSettle = async () => {
    if (!isConnected || amountNum <= 0 || priceNum <= 0) return;
    
    setSettleStatus('Processing...');
    const result = await settleTrade({
      side: side === 'BUY' ? 'buy' : 'sell',
      size: amountNum,
      price: priceNum,
    });
    
    if (result.success) {
      setSettleStatus(`✅ Trade executed! Tx: ${result.txHash?.slice(0, 10)}...`);
      refetch();
      refetchAll();
      refetchTrades();
      refetchStats();
    } else {
      setSettleStatus(`❌ ${result.error}`);
    }
  };

  return (
    <Modal
      id="trade"
      icon={<span>📊</span>}
      title="BTC/USDT"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      buttons={[
        { value: 'Refresh', onClick: refetch },
        { value: 'Close', onClick: onClose },
      ]}
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
          <span style={{ fontSize: fs(20), fontWeight: 'bold' }}>${currentPrice.toLocaleString()}</span>
          <Frame style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: fs(11) }}>24h Vol: <strong>{stats.volume > 0 ? `${stats.volume.toFixed(2)} BTC` : 'N/A'}</strong></span>
          <span style={{ fontSize: fs(11) }}>High: <strong>{stats.high > 0 ? `$${stats.high.toLocaleString()}` : 'N/A'}</strong></span>
          <span style={{ fontSize: fs(11) }}>Low: <strong>{stats.low > 0 ? `$${stats.low.toLocaleString()}` : 'N/A'}</strong></span>
          <span style={{ fontSize: fs(11) }}>Spread: <strong>{aggregated.spread ? `$${aggregated.spread.toLocaleString()}` : 'N/A'}</strong></span>
        </Frame>

        {/* Loading/Error Banner */}
        {loading && (
          <Frame style={{ padding: '4px 8px', background: '#ffffcc', borderBottom: '1px solid #cccc00' }}>
            <span style={{ fontSize: fs(10), color: '#cc8800' }}>⏳ Loading orders...</span>
          </Frame>
        )}
        {error && (
          <Frame style={{ padding: '4px 8px', background: '#fff0f0', borderBottom: '1px solid #cc0000' }}>
            <span style={{ fontSize: fs(10), color: '#cc0000' }}>⚠️ {error}</span>
          </Frame>
        )}

        {/* Main Trading Area */}
        <Frame style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT COLUMN  */}
          <Frame style={{ width: 200, flexDirection: 'column', borderRight: '2px solid', borderColor: '#808080', padding: 8 }}>
            <Frame style={{
              padding: '6px 8px',
              background: '#000080',
              color: 'white',
              fontWeight: 'bold',
              fontSize: fs(12),
              marginBottom: 8,
              borderTop: '2px solid white',
              borderLeft: '2px solid white',
              borderRight: '2px solid #404040',
              borderBottom: '2px solid #404040',
            }}>
              ℹ️ How to Use
            </Frame>
             
            {!isConnected && (
              <Frame style={{ 
                padding: '6px 8px', 
                background: '#ffffcc', 
                border: '1px solid #cccc00',
                marginBottom: 8,
              }}>
                <Frame style={{ fontSize: fs(11), fontWeight: 'bold', color: '#cc8800', marginBottom: 4 }}>
                  ⚠️ Before Trading:
                </Frame>
                <Frame style={{ fontSize: fs(11), lineHeight: 1.3 }}>
                  1. Click Wallet icon to connect<br/>
                  2. Get testnet tokens<br/>
                  3. Approve on first trade
                </Frame>
              </Frame>
            )}
            
            {/* Trading Steps */}
            <Frame style={{ flexDirection: 'column', gap: 6 }}>
              <Frame style={{ fontSize: fs(11), lineHeight: 1.3 }}>
                <strong style={{ color: '#000080' }}>1. View Order Book</strong><br/>
                See offers from AI agents
              </Frame>
              <Frame style={{ fontSize: fs(11), lineHeight: 1.3 }}>
                <strong style={{ color: '#000080' }}>2. Set Price/Size</strong><br/>
                Click orders to auto-fill
              </Frame>
              <Frame style={{ fontSize: fs(11), lineHeight: 1.3 }}>
                <strong style={{ color: '#000080' }}>3. Execute</strong><br/>
                Confirm in wallet popup
              </Frame>
              <Frame style={{ fontSize: fs(11), lineHeight: 1.3 }}>
                <strong style={{ color: '#000080' }}>4. Try News Tab</strong><br/>
                Add news & watch agents react
              </Frame>
            </Frame>
            
            <Frame style={{ flex: 1 }} />
            
            {/* Quick Balance Display */}
            <Frame style={{
              padding: '8px',
              background: '#e0e0e0', 
              marginTop: "20px"
            }}>
              <Frame style={{ fontSize: fs(11), fontWeight: 'bold', marginBottom: 4, color: '#000080' }}>
                Your Balances
              </Frame>
              {!isConnected ? (
                <Frame style={{ padding: '4px', background: '#ffffcc' }}>
                  <span style={{ fontSize: fs(11), color: '#cc8800' }}>⚠️ Connect wallet</span>
                </Frame>
              ) : (
                <Frame style={{ flexDirection: 'column', gap: 6 }}>
                  {balances.filter(b => b.symbol === 'USDT' || b.symbol === 'BTC').map((token) => (
                    <Frame key={token.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: fs(12) }}>
                      <Frame style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src={token.icon} alt={token.symbol} style={{ width: 18, height: 18 }} />
                        <span style={{ fontSize: fs(11) }}>{token.symbol}:</span>
                      </Frame>
                      <span style={{ fontWeight: 'bold', fontSize: fs(13) }}>
                        {token.amount >= 1000 
                          ? token.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                          : token.amount.toFixed(4)
                        }
                      </span>
                    </Frame>
                  ))}
                </Frame>
              )}
            </Frame>
          </Frame>

          {/* MIDDLE COLUMN */}
          <Frame style={{ flex: 1.5, flexDirection: 'column', borderRight: '2px solid', borderColor: '#808080' }}>

            {/* Asks (Sells) */}
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
                {groupedAsks.length === 0 ? (
                  <Frame style={{ padding: 16, textAlign: 'center' }}>
                    <span style={{ fontSize: fs(11), color: '#888' }}>No asks available</span>
                  </Frame>
                ) : (
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
                        const depthPct = totalLiquidity > 0 ? (cumulative / totalLiquidity) * 100 : 0;
                        return (
                          <tr
                            key={`ask-${i}`}
                            onClick={() => handlePriceClick(entry.price)}
                            style={{ cursor: 'pointer', background: `linear-gradient(to left, rgba(255,0,0,${depthPct / 300}), transparent)` }}
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
                            <td style={{ textAlign: 'left', padding: '3px 6px', color: '#666', fontFamily: 'monospace', fontSize: fs(10) }}>
                              <AgentAddresses addresses={entry.orders.map(o => o.address)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
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
              <span style={{ fontSize: fs(12) }}>Mid Price: <strong>${currentPrice.toLocaleString()}</strong></span>
              <span style={{ fontSize: fs(12), fontWeight: 'bold', color: '#008000' }}>
                SPREAD: {aggregated.spread ? `$${aggregated.spread.toLocaleString()}` : 'N/A'}
              </span>
            </Frame>

            {/* Bids (Buys) */}
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
                {groupedBids.length === 0 ? (
                  <Frame style={{ padding: 16, textAlign: 'center' }}>
                    <span style={{ fontSize: fs(11), color: '#888' }}>No bids available</span>
                  </Frame>
                ) : (
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
                        const depthPct = totalLiquidity > 0 ? (cumulative / totalLiquidity) * 100 : 0;
                        return (
                          <tr
                            key={`bid-${i}`}
                            onClick={() => handlePriceClick(entry.price)}
                            style={{ cursor: 'pointer', background: `linear-gradient(to left, rgba(0,128,0,${depthPct / 300}), transparent)` }}
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
                            <td style={{ textAlign: 'left', padding: '3px 6px', color: '#666', fontFamily: 'monospace', fontSize: fs(10) }}>
                              <AgentAddresses addresses={entry.orders.map(o => o.address)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Frame>
            </Frame>
          </Frame>

          {/* Right Panel */}
          <Frame style={{ width: 340, flexDirection: 'column', padding: 8 }}>
            {/* Limit Only Badge */}
            <Frame style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 0',
              marginBottom: 8,
              background: '#000080',
              color: 'white',
              fontWeight: 'bold',
              fontSize: fs(11),
            }}>
              LIMIT ORDER
            </Frame>

            {/* BUY/SELL Toggle */}
            <Frame style={{ display: 'flex', marginBottom: 8 }}>
              <Button
                onClick={() => setSide('BUY')}
                style={{
                  flex: 1,
                  background: side === 'BUY' ? '#000080' : '#808080',
                  color: 'white',
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
                  background: side === 'SELL' ? '#000080' : '#808080',
                  color: 'white',
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

            {/* Price Input */}
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

            {/* Order Summary */}
            <Fieldset legend="Order Summary" style={{ marginBottom: 8, fontSize: fs(13) }}>
              <Frame style={{ flexDirection: 'column', gap: 4 }}>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Est. Total:</span>
                  <span style={{ fontWeight: 'bold' }}>{estTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
                </Frame>
                <Frame style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fee (0.1%):</span>
                  <span>{(estTotal * 0.001).toFixed(4)} USDT</span>
                </Frame> 
                {aggregated.spread && (
                  <Frame style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(10), color: '#666' }}>
                    <span>vs Best:</span>
                    <span style={{ color: priceNum > 0 ? (side === 'BUY' ? '#008000' : '#cc0000') : '#666' }}>
                      {side === 'BUY' && groupedAsks.length > 0 
                        ? `-${(((groupedAsks[groupedAsks.length - 1]?.price - priceNum) / groupedAsks[groupedAsks.length - 1]?.price) * 100).toFixed(2)}%`
                        : side === 'SELL' && groupedBids.length > 0
                        ? `+${(((priceNum - groupedBids[0]?.price) / groupedBids[0]?.price) * 100).toFixed(2)}%`
                        : 'N/A'
                      }
                    </span>
                  </Frame>
                )}
              </Frame>
            </Fieldset>

            {/* Execute Button */}
            <Button
              onClick={handleSettle}
              style={{
                width: '100%',
                background: '#000080',
                color: 'white',
                fontWeight: 'bold',
                fontSize: fs(16),
                padding: '14px 0',
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}
              disabled={!isConnected || settling || amountNum <= 0}
            >
              {settling ? 'PROCESSING...' : side === 'BUY' ? 'BUY BTC' : 'SELL BTC'}
            </Button>

            {/* Settle Status */}
            {settleStatus && (
              <Frame style={{
                padding: '6px 8px',
                marginTop: 4,
                background: settleStatus.startsWith('✅') ? '#f0fff0' : '#fff0f0',
                border: `1px solid ${settleStatus.startsWith('✅') ? '#00aa00' : '#cc0000'}`,
                fontSize: fs(10),
              }}>
                {settleStatus}
              </Frame>
            )}

            <Frame style={{ height: 1, background: '#808080', margin: '12px 0' }} />

            {/* Bottom Section  */}
            <Frame style={{ flex: 1, flexDirection: 'column' }}>
              {/* Tabs */}
              <Frame style={{
                display: 'flex',
                marginBottom: 4,
                borderTop: '2px solid white',
                borderLeft: '2px solid white',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
              }}>
                <Button
                  onClick={() => setBottomTab('trades')}
                  style={{
                    flex: 1,
                    background: bottomTab === 'trades' ? '#000080' : '#808080',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fs(11),
                    padding: '4px 0',
                    borderTop: '2px solid white',
                    borderLeft: '2px solid white',
                    borderRight: bottomTab === 'trades' ? '2px solid white' : 'none',
                    borderBottom: 'none',
                  }}
                >
                  Recent Trades
                </Button>
                <Button
                  onClick={() => setBottomTab('news')}
                  style={{
                    flex: 1,
                    background: bottomTab === 'news' ? '#000080' : '#808080',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fs(11),
                    padding: '4px 0',
                    borderTop: '2px solid white',
                    borderRight: '2px solid #404040',
                    borderBottom: 'none',
                  }}
                >
                  Recent News ({pair?.news?.length || 0})
                </Button>
              </Frame>

              {/* Tab Content */}
              <Frame style={{ flex: 1, overflow: 'auto', background: 'white', border: '2px inset' }}>
                {bottomTab === 'trades' ? (
                  /* Recent Trades */
                  trades.length === 0 ? (
                    <Frame style={{ padding: 16, textAlign: 'center' }}>
                      <span style={{ fontSize: fs(10), color: '#888' }}>
                        {tradesLoading ? 'Loading trades...' : 'No trades yet'}
                      </span>
                    </Frame>
                  ) : (
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
                        {trades.map((trade) => (
                          <tr key={trade.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{
                              textAlign: 'right',
                              padding: '2px 4px',
                              color: trade.side === 'buy' ? '#008000' : '#cc0000',
                              fontWeight: 'bold'
                            }}>
                              {trade.price.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '2px 4px' }}>{trade.base_amount.toFixed(4)}</td>
                            <td style={{
                              textAlign: 'center',
                              padding: '2px 4px',
                              color: trade.side === 'buy' ? '#008000' : '#cc0000',
                              fontSize: fs(9)
                            }}>
                              {trade.side.toUpperCase()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '2px 4px', color: '#888' }}>{formatTradeTime(trade.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  /* News */
                  <Frame style={{ flexDirection: 'column', padding: 4, gap: 4 }}>
                    {pair?.news?.length === 0 && (
                      <span style={{ fontSize: fs(10), color: '#888', textAlign: 'center', padding: 8 }}>
                        No news available
                      </span>
                    )}
                    {pair?.news?.slice(0, 10).map((item) => (
                      <Frame key={item.id} style={{
                        padding: '4px 6px',
                        background: '#fafafa',
                        borderBottom: '1px solid #eee',
                      }}>
                        <span style={{ fontSize: fs(10), fontWeight: 'bold', display: 'block' }}>
                          "{item.headline}"
                        </span>
                        <span style={{ fontSize: fs(9), color: '#666' }}>
                          {item.summary.length > 80 ? item.summary.slice(0, 80) + '...' : item.summary}
                        </span>
                        <span style={{
                          fontSize: fs(9),
                          fontWeight: 'bold',
                          color: directionColor(item.direction as NewsDirection),
                        }}>
                          {item.magnitude >= 0 ? '+' : ''}{item.magnitude}% {directionArrow(item.direction as NewsDirection)}
                        </span>
                      </Frame>
                    ))}
                  </Frame>
                )}
              </Frame>
            </Frame>
          </Frame>
        </Frame>
      </Frame>
    </Modal>
  );
}