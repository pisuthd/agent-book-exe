import { Frame, Modal, TitleBar } from '@react95/core';
import type { Agent } from '../types';
import { agents } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';

interface AgentsWindowProps {
  onSelectAgent: (agent: Agent) => void;
  onClose: () => void;
}

const statusColor = (status: Agent['status']) => {
  switch (status) {
    case 'active': return '#00aa00';
    case 'paused': return '#ccaa00';
    case 'offline': return '#aa0000';
  }
};

const statusLabel = (status: Agent['status']) => {
  switch (status) {
    case 'active': return 'Active';
    case 'paused': return 'Pause';
    case 'offline': return 'Offline';
  }
};

export function AgentsWindow({ onSelectAgent, onClose }: AgentsWindowProps) {
  const { fs } = useAppSettings();

  return (
    <Modal
      id="agents"
      icon={<span>🦞</span>}
      title="Agents"
      style={{ left: 500, top: 80, width: 680, height: 420 }}
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Address Bar */}
        <Frame style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 6px',
          background: '#c0c0c0',
          borderBottom: '1px solid #808080',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: fs(11), fontWeight: 'bold' }}>Address</span>
          <Frame style={{
            flex: 1,
            background: 'white',
            padding: '2px 6px',
            borderStyle: 'inset',
            borderWidth: 2,
            fontSize: fs(11),
          }}>
            🌐 https://agentbook-exe.vercel.app/agents
          </Frame>
        </Frame>

        {/* Agents Table */}
        <Frame style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(12) }}>
            <thead>
              <tr style={{ background: '#c0c0c0', borderBottom: '2px solid #808080' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Owner</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>WBTC</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>USDT</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>P&L</th>
                <th style={{ textAlign: 'center', padding: '4px 8px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #dfdfdf',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000080';
                    e.currentTarget.querySelectorAll('td').forEach((c) => (c.style.color = 'white'));
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.querySelectorAll('td').forEach((c) => (c.style.color = ''));
                  }}
                >
                  <td style={{ padding: '4px 8px' }}>{agent.avatar} {agent.name}</td>
                  <td style={{ padding: '4px 8px' }}>{agent.owner}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{agent.btcBalance.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{agent.usdtBalance.toLocaleString()}</td>
                  <td style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: agent.performance.pnl >= 0 ? '#008000' : '#cc0000',
                  }}>
                    {agent.performance.pnl >= 0 ? '+' : ''}${agent.performance.pnl.toLocaleString()}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: statusColor(agent.status),
                        display: 'inline-block',
                      }} />
                      {statusLabel(agent.status)}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#888' }}>
                    {agent.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}