import { useState } from 'react';
import { Frame, Modal, TitleBar, Button } from '@react95/core';
import { useBalance, useReadContract, useEnsName } from 'wagmi';
import { erc20Abi } from 'viem';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAgents } from '../hooks/useAgents';
import { TOKENS, PRICES } from '../hooks/useTokens';
import { AddAgentWindow } from './AddAgentWindow';

const WBTC_ADDR = TOKENS.BTC.address;
const USDT_ADDR = TOKENS.USDT.address;

// ENS name display for address
function EnsNameCell({ address }: { address: string }) {
  const { fs } = useAppSettings();
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 11155111,
  });
  
  if (ensName) {
    return <span style={{ fontSize: fs(11) }}>{ensName}</span>;
  }
  return <span style={{ fontFamily: 'monospace', fontSize: fs(10) }}>{address.slice(0, 6)}...{address.slice(-4)}</span>;
}

// Liquidity display component for an address
function LiquidityCell({ address }: { address: string }) {
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
  const btc = btcBalance ? Number(btcBalance) / 1e6 : 0;
  const usdt = usdtBalance ? Number(usdtBalance) / 1e6 : 0;

  const liquidityUSD = eth * PRICES.ETH + btc * PRICES.BTC + usdt;

  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
      ${liquidityUSD > 1000 ? `${(liquidityUSD / 1000).toFixed(1)}K` : liquidityUSD.toFixed(0)}
    </span>
  );
}

interface AgentsWindowProps {
  onSelectAgent: (agent: { id: string; walletAddress: string }) => void;
  onClose: () => void;
}

export function AgentsWindow({ onSelectAgent, onClose }: AgentsWindowProps) {
  const { fs } = useAppSettings();
  const { agents, loading, error, refetch } = useAgents();
  const [showAddAgent, setShowAddAgent] = useState(false);

  return (
    <>
      <Modal
        id="agents"
        icon={<span>🦞</span>}
        title="Agents"
        style={{ left: 500, top: 80, width: 700, height: 420 }}
        titleBarOptions={<TitleBar.Close onClick={onClose} />}
        buttons={[
          { value: 'Add Your Agent', onClick: () => setShowAddAgent(true) },
          { value: 'Close', onClick: onClose },
        ]}
      >
        <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: "0px" }}>
          {/* Loading/Error */}
          {loading && (
            <Frame style={{ padding: '8px 12px', background: '#ffffcc', borderBottom: '1px solid #cccc00' }}>
              <span style={{ fontSize: fs(10), color: '#cc8800' }}>⏳ Loading agents...</span>
            </Frame>
          )}
          {error && (
            <Frame style={{ padding: '8px 12px', background: '#fff0f0', borderBottom: '1px solid #cc0000' }}>
              <span style={{ fontSize: fs(10), color: '#cc0000' }}>⚠️ {error}</span>
            </Frame>
          )}

          {/* Agents Table */}
          <Frame style={{ flex: 1, overflow: 'auto' }}>
            {agents.length === 0 && !loading ? (
              <Frame style={{ padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: fs(11), color: '#888' }}>
                  No agents found. Click "Add Your Agent" to register.
                </span>
              </Frame>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(12) }}>
                <thead>
                  <tr style={{ background: '#c0c0c0', borderBottom: '2px solid #808080' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Agent Name</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Peer ID</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Framework</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Liquidity</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Open Orders</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.wallet_address}
                      onClick={() => onSelectAgent({ id: agent.wallet_address, walletAddress: agent.wallet_address })}
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
                      <td style={{ padding: '4px 8px' }}>
                        <EnsNameCell address={agent.wallet_address} />
                      </td>
                      <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontSize: fs(10) }}>
                        {agent.peer_id.slice(0, 16)}...
                      </td>
                      <td style={{ padding: '4px 8px', fontSize: fs(11) }}>
                        OpenClaw
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <LiquidityCell address={agent.wallet_address} />
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        {agent.stats?.openOrders || 0}
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
                            background: (agent.stats?.openOrders || 0) > 0 ? '#00aa00' : '#888',
                            display: 'inline-block',
                          }} />
                          {(agent.stats?.openOrders || 0) > 0 ? 'Active' : 'Idle'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Frame>
        </Modal.Content>
      </Modal>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <AddAgentWindow
          onClose={() => setShowAddAgent(false)}
          onSuccess={() => {
            refetch();
            setShowAddAgent(false);
          }}
        />
      )}
    </>
  );
}