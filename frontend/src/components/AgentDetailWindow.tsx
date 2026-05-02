// import { useState } from 'react';
import { useBalance, useReadContract, useEnsName } from 'wagmi';
import { erc20Abi } from 'viem';
import { Frame, Modal, Fieldset, TitleBar } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAgentDetail } from '../hooks/useAgents';
import { TOKENS, PRICES } from '../hooks/useTokens';
// import { MARKET_API_URL } from '../config/marketApi';

// Token addresses
const WBTC_ADDR = TOKENS.BTC.address;
const USDT_ADDR = TOKENS.USDT.address;

// ENS resolution component
function EnsDisplay({ address }: { address: string }) {
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 11155111,
  });
  return (
    <span>
      {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
      {!ensName && <span style={{ color: '#888', fontSize: '0.85em' }}> ({address})</span>}
    </span>
  );
}

// Balance display for a specific address
function AgentBalances({ address }: { address: string }) {
  const { data: ethBalance } = useBalance({ address: address as `0x${string}` });
  const { data: btcBalance } = useReadContract({
    address: WBTC_ADDR,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });
  const { data: usdtBalance } = useReadContract({
    address: USDT_ADDR,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  const eth = ethBalance ? Number(ethBalance.value.toString()) / 1e18 : 0;
  const btc = btcBalance ? Number(btcBalance) / 1e6 : 0; // 6 decimals
  const usdt = usdtBalance ? Number(usdtBalance) / 1e6 : 0; // 6 decimals

  const totalUSD = eth * PRICES.ETH + btc * PRICES.BTC + usdt * PRICES.USDT;

  return (
    <table style={{ fontSize: '12px', width: '100%' }}>
      <tbody>
        <tr>
          <td>ETH:</td>
          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{eth.toFixed(4)} (${(eth * PRICES.ETH).toLocaleString()})</td>
        </tr>
        <tr>
          <td>BTC:</td>
          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{btc.toFixed(4)} (${(btc * PRICES.BTC).toLocaleString()})</td>
        </tr>
        <tr>
          <td>USDT:</td>
          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{usdt.toFixed(2)}</td>
        </tr>
        <tr style={{ borderTop: '1px solid #ccc' }}>
          <td><strong>Total:</strong></td>
          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${totalUSD.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  );
}

interface AgentDetailWindowProps {
  agent: { id: string; walletAddress: string };
  onClose: () => void;
  offsetIndex: number;
}

export function AgentDetailWindow({ agent, onClose, offsetIndex }: AgentDetailWindowProps) {
  const { fs } = useAppSettings();
  const { agent: agentData, loading, error } = useAgentDetail(agent.walletAddress);
  // const [deleting, setDeleting] = useState(false);

  const leftOffset = 160 + offsetIndex * 30;
  const topOffset = 60 + offsetIndex * 30;


  // const handleRemoveAgent = async () => {
  //   if (!confirm('Are you sure you want to remove this agent?')) return;

  //   setDeleting(true);
  //   try {
  //     const response = await fetch(`${MARKET_API_URL}/api/agents/${agent.walletAddress}`, {
  //       method: 'DELETE',
  //     });

  //     if (response.ok) {
  //       onClose();
  //     } else {
  //       const data = await response.json();
  //       alert(data.error || 'Failed to remove agent');
  //     }
  //   } catch (err) {
  //     alert('Failed to remove agent');
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

  return (
    <Modal
      id={`agent-detail-${agent.walletAddress}`}
      icon={<span>🦞</span>}
      title="Agent Detail"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: leftOffset, top: topOffset, width: 520, height: "auto" }}
      buttons={[
        // { value: deleting ? 'Removing...' : 'Remove Agent', onClick: handleRemoveAgent },
        { value: 'Close', onClick: onClose }
      ]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto', padding: 8 }}>
        {/* Loading/Error */}
        {loading && (
          <Frame style={{ padding: '8px', background: '#ffffcc', marginBottom: 8 }}>
            <span style={{ fontSize: fs(10), color: '#cc8800' }}>⏳ Loading agent data...</span>
          </Frame>
        )}
        {error && (
          <Frame style={{ padding: '8px', background: '#fff0f0', marginBottom: 8 }}>
            <span style={{ fontSize: fs(10), color: '#cc0000' }}>⚠️ {error}</span>
          </Frame>
        )}

        {agentData && (
          <>
            {/* Header */}
            <Frame style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #ccc',
            }}>
              <Frame style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🦞</span>
                <Frame style={{ flexDirection: 'column' }}>
                  <strong style={{ fontSize: fs(14) }}>Agent</strong>
                  <span style={{ fontSize: fs(11), color: '#666' }}>
                    Name: <EnsDisplay address={agentData.wallet_address} />
                  </span>
                </Frame>
              </Frame>
              <Frame style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: fs(12) }}>
                  Status:
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: (agentData.stats?.openOrders || 0) > 0 ? '#00aa00' : '#888',
                    display: 'inline-block'
                  }} />
                  {(agentData.stats?.openOrders || 0) > 0 ? 'Active' : 'Idle'}
                </span>
                <span style={{ fontSize: fs(11), color: '#666' }}>
                  Peer: {agentData.peer_id.slice(0, 16)}...
                </span>
              </Frame>
            </Frame>

            {/* Balances & Stats */}
            <Frame style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Fieldset legend="On-Chain Balances" style={{ flex: 1 }}>
                <AgentBalances address={agentData.wallet_address} />
              </Fieldset>
              <Fieldset legend="Trading Stats" style={{ flex: 1 }}>
                <table style={{ fontSize: fs(12), width: '100%' }}>
                  <tbody>
                    <tr>
                      <td>Total Trades:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{agentData.stats?.tradeCount || 0}</td>
                    </tr>
                    <tr>
                      <td>Volume:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(agentData.stats?.volume || 0).toFixed(4)} BTC</td>
                    </tr>
                    <tr>
                      <td>Open Orders:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{agentData.stats?.openOrders || 0}</td>
                    </tr>
                    <tr>
                      <td>High Price:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {agentData.stats?.high > 0 ? `$${agentData.stats.high.toLocaleString()}` : 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td>Low Price:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {agentData.stats?.low > 0 ? `$${agentData.stats.low.toLocaleString()}` : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Fieldset>
            </Frame>

            {/* Current Orders */}
            <Fieldset legend="Current Orders" style={{ marginBottom: 12 }}>
              {agentData.orders && agentData.orders.length > 0 ? (
                <Frame style={{ display: 'flex', gap: 8 }}>
                  <Frame style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: 8 }}>
                    <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>BID</strong>
                    {agentData.orders.filter((o: any) => o.side === 'bid').map((o: any, i: number) => (
                      <Frame key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12), padding: '1px 0' }}>
                        <span style={{ color: '#008000' }}>${o.price.toLocaleString()}</span>
                        <span>{o.size.toFixed(4)} BTC</span>
                        <span style={{ color: '#888' }}>(${o.size * o.price > 1000 ? `${(o.price * o.size / 1000).toFixed(1)}K` : o.price * o.size} USDT)</span>
                      </Frame>
                    ))}
                  </Frame>
                  <Frame style={{ flex: 1, paddingLeft: 8 }}>
                    <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>ASK</strong>
                    {agentData.orders.filter((o: any) => o.side === 'ask').map((o: any, i: number) => (
                      <Frame key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12), padding: '1px 0' }}>
                        <span style={{ color: '#cc0000' }}>${o.price.toLocaleString()}</span>
                        <span>{o.size.toFixed(4)} BTC</span>
                        <span style={{ color: '#888' }}>(${o.size * o.price > 1000 ? `${(o.price * o.size / 1000).toFixed(1)}K` : o.price * o.size} USDT)</span>
                      </Frame>
                    ))}
                  </Frame>
                </Frame>
              ) : (
                <span style={{ fontSize: fs(11), color: '#888' }}>No open orders</span>
              )}
            </Fieldset>

            {/* Recent Trades */}
            <Fieldset legend="Recent Trades">
              {agentData.trades && agentData.trades.length > 0 ? (
                <table style={{ fontSize: fs(11), width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#c0c0c0' }}>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Size</th>
                      <th style={{ textAlign: 'center', padding: '2px 4px' }}>Side</th>
                      <th style={{ textAlign: 'right', padding: '2px 4px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentData.trades.map((trade: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ textAlign: 'right', padding: '2px 4px' }}>${trade.price.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '2px 4px' }}>{trade.base_amount.toFixed(4)}</td>
                        <td style={{
                          textAlign: 'center',
                          padding: '2px 4px',
                          color: trade.side === 'buy' ? '#008000' : '#cc0000',
                          fontWeight: 'bold'
                        }}>{trade.side.toUpperCase()}</td>
                        <td style={{ textAlign: 'right', padding: '2px 4px', color: '#888' }}>
                          {new Date(trade.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span style={{ fontSize: fs(11), color: '#888' }}>No recent trades</span>
              )}
            </Fieldset>
 
          </>
        )}
      </Modal.Content>
    </Modal>
  );
}