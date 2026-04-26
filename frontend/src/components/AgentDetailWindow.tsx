import { Frame, Modal, Fieldset } from '@react95/core';
import type { Agent } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';

interface AgentDetailWindowProps {
  agent: Agent;
  onClose: () => void;
  offsetIndex: number;
}

export function AgentDetailWindow({ agent, onClose, offsetIndex }: AgentDetailWindowProps) {
  const { fs } = useAppSettings();
  const statusColor = agent.status === 'active' ? '#00aa00' : agent.status === 'paused' ? '#ccaa00' : '#aa0000';
  const askOrders = agent.orders.filter((o) => o.side === 'ask');
  const bidOrders = agent.orders.filter((o) => o.side === 'bid');
  const leftOffset = 160 + offsetIndex * 30;
  const topOffset = 60 + offsetIndex * 30;

  return (
    <Modal
      id={`agent-detail-${agent.id}`}
      icon={<span>{agent.avatar}</span>}
      title={`${agent.name} — Detail`}
      style={{ left: leftOffset, top: topOffset, width: 520, height: 480 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto', padding: 8 }}>
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
            <span style={{ fontSize: 24 }}>{agent.avatar}</span>
            <Frame style={{ flexDirection: 'column' }}>
              <strong style={{ fontSize: fs(14) }}>{agent.name}</strong>
              <span style={{ fontSize: fs(11), color: '#666' }}>Owner: {agent.owner}</span>
              <span style={{ fontSize: fs(11), color: '#666' }}>Strategy: {agent.strategy}</span>
            </Frame>
          </Frame>
          <Frame style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: fs(12) }}>
              Status:
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
              {agent.status === 'active' ? 'Active' : agent.status === 'paused' ? 'Paused' : 'Offline'}
            </span>
            <span style={{ fontSize: fs(11), color: '#666' }}>Joined: 5m ago</span>
          </Frame>
        </Frame>

        <p style={{ fontSize: fs(12), color: '#444', margin: '0 0 12px' }}>{agent.description}</p>

        {/* Balances & Performance */}
        <Frame style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Fieldset legend="Balances" style={{ flex: 1 }}>
            <table style={{ fontSize: fs(12), width: '100%' }}>
              <tbody>
                <tr><td>BTC:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{agent.btcBalance.toFixed(2)} (${(agent.btcBalance * 64000).toLocaleString()})</td></tr>
                <tr><td>USDT:</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{agent.usdtBalance.toLocaleString()}</td></tr>
                <tr style={{ borderTop: '1px solid #ccc' }}>
                  <td>Total:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${(agent.btcBalance * 64000 + agent.usdtBalance).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </Fieldset>
          <Fieldset legend="Performance" style={{ flex: 1 }}>
            <table style={{ fontSize: fs(12), width: '100%' }}>
              <tbody>
                <tr>
                  <td>P&L:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: agent.performance.pnl >= 0 ? '#008000' : '#cc0000' }}>
                    {agent.performance.pnl >= 0 ? '+' : ''}${agent.performance.pnl.toLocaleString()} ({agent.performance.pnlPct >= 0 ? '+' : ''}{agent.performance.pnlPct}%)
                  </td>
                </tr>
                <tr><td>Trades:</td><td style={{ textAlign: 'right' }}>{agent.performance.trades}</td></tr>
                <tr><td>Win rate:</td><td style={{ textAlign: 'right' }}>{(agent.performance.winRate * 100).toFixed(0)}%</td></tr>
                <tr><td>Avg spread:</td><td style={{ textAlign: 'right' }}>{agent.performance.avgSpreadBps} bps</td></tr>
              </tbody>
            </table>
          </Fieldset>
        </Frame>

        {/* Current Orders */}
        <Fieldset legend="Current Orders" style={{ marginBottom: 12 }}>
          <Frame style={{ display: 'flex', gap: 8 }}>
            <Frame style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: 8 }}>
              <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>BID</strong>
              {bidOrders.map((o, i) => (
                <Frame key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12), padding: '1px 0' }}>
                  <span>{o.price.toLocaleString()}</span>
                  <span>{o.size.toFixed(2)}</span>
                  <span style={{ color: '#888' }}>({(o.price * o.size / 1000).toFixed(1)}K USDT)</span>
                </Frame>
              ))}
            </Frame>
            <Frame style={{ flex: 1, paddingLeft: 8 }}>
              <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>ASK</strong>
              {askOrders.map((o, i) => (
                <Frame key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12), padding: '1px 0' }}>
                  <span>{o.price.toLocaleString()}</span>
                  <span>{o.size.toFixed(2)}</span>
                  <span style={{ color: '#888' }}>({(o.price * o.size / 1000).toFixed(1)}K USDT)</span>
                </Frame>
              ))}
            </Frame>
          </Frame>
        </Fieldset>

        {/* Risk Parameters */}
        <Fieldset legend="Risk Parameters">
          <table style={{ fontSize: fs(12), width: '100%' }}>
            <tbody>
              <tr>
                <td>Max position:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.maxPositionBtc} BTC</td>
                <td>Spread:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.spreadBps} bps</td>
              </tr>
              <tr>
                <td>Max drawdown:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.maxDrawdownPct}%</td>
                <td>Order levels:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.orderLevels}</td>
              </tr>
              <tr>
                <td>Skew factor:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.skewFactor}</td>
                <td>Rebalance:</td><td style={{ fontWeight: 'bold' }}>{agent.riskParams.rebalanceIntervalSec}s</td>
              </tr>
            </tbody>
          </table>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}
