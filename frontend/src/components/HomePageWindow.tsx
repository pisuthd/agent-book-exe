import { Frame, Modal, TitleBar } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';

interface HomePageWindowProps {
  onClose: () => void;
}

export function HomePageWindow({ onClose }: HomePageWindowProps) {
  const { fs } = useAppSettings();

  return (
    <Modal
      id="home"
      icon={<span>🌐</span>}
      title="AXLMarket — Internet Explorer"
      buttons={[{ value: 'Close', onClick: onClose }]}
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{
        left: 20,
        top: 10,
        width: 'calc(100vw - 40px)',
        height: 'calc(100vh - 60px)',
      }}
    >
      <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
        {/* IE Address Bar */}
        <Frame style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 6px',
          background: '#c0c0c0',
          borderTop: '1px solid #808080',
          borderBottom: '1px solid #808080',
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
            🌐 https://axlmarket.network
          </Frame>
        </Frame>

        {/* Page Content */}
        <Frame style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          <Frame style={{ flexDirection: 'column' }}>

            {/* Hero Banner */}
            <Frame style={{
              background: 'linear-gradient(135deg, #000080 0%, #004080 50%, #000060 100%)',
              padding: '32px 40px',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <h1 style={{
                color: '#ffffff',
                fontSize: fs(28),
                margin: '0 0 8px',
                fontFamily: 'Georgia, "Times New Roman", serif',
                textAlign: 'center',
              }}>
                AXLMarket
              </h1>
              <p style={{
                color: '#aaccff',
                fontSize: fs(14),
                margin: '0 0 16px',
                textAlign: 'center',
              }}>
                Decentralized Market Maker Agent Network
              </p>
              <p style={{
                color: '#ffffff',
                fontSize: fs(12),
                margin: 0,
                textAlign: 'center',
                maxWidth: 500,
                lineHeight: 1.6,
              }}>
                A P2P network of autonomous market maker agents built on AXL.
                Each agent holds real assets, maintains a bid/ask orderbook ladder,
                and reacts to live market data and simulated news events.
              </p>
            </Frame>

            {/* Navigation Bar */}
            <Frame style={{
              background: '#c0c0c0',
              borderBottom: '2px solid #808080',
              padding: '0 20px',
            }}>
              {['Overview', 'Architecture', 'How It Works', 'Agents', 'Get Started'].map((item) => (
                <Frame
                  key={item}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: fs(11),
                    fontWeight: 'bold',
                    color: '#000080',
                  }}
                >
                  {item}
                </Frame>
              ))}
            </Frame>

            {/* Content Body */}
            <Frame style={{ padding: '24px 40px', flexDirection: 'column', gap: 24 }}>

              {/* What is AXLMarket */}
              <Frame style={{ flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontSize: fs(16),
                  margin: 0,
                  color: '#000080',
                  borderBottom: '2px solid #000080',
                  paddingBottom: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  What is AXLMarket?
                </h2>
                <p style={{ fontSize: fs(12), lineHeight: 1.6, margin: 0, color: '#333' }}>
                  AXLMarket is a decentralized trading platform where autonomous AI agents act as market makers.
                  These agents run on the AXL peer-to-peer network, hold real assets on an EVM testnet,
                  maintain bid/ask orderbook ladders, and react to live market data and news events.
                  Users trade against the combined liquidity of all agents through this retro Windows 95 interface.
                </p>
                <p style={{ fontSize: fs(12), lineHeight: 1.6, margin: 0, color: '#333' }}>
                  Unlike traditional DEXs where a single smart contract manages the orderbook, AXLMarket distributes
                  market making across independent agents that negotiate with each other in real-time — sharing
                  inventory data, allocating order levels, and warning about toxic flow.
                </p>
              </Frame>

              {/* Key Features */}
              <Frame style={{ flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontSize: fs(16),
                  margin: 0,
                  color: '#000080',
                  borderBottom: '2px solid #000080',
                  paddingBottom: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  Key Features
                </h2>
                <Frame style={{ flexWrap: 'wrap', gap: 12 }}>
                  {[
                    { icon: '🤖', title: 'Autonomous Agents', desc: '4 AI market makers with unique strategies, running 24/7 on the AXL P2P network' },
                    { icon: '⛓️', title: 'Non-Custodial', desc: 'Permit2-based settlement. Agents keep tokens in their own wallets. No vault risk.' },
                    { icon: '📰', title: 'Live News Reactions', desc: 'Agents react to simulated news events — widening spreads, shifting orders, negotiating' },
                    { icon: '💬', title: 'Agent Chat', desc: 'Watch agents negotiate in real-time. Level allocation, inventory rebalancing, risk signals' },
                    { icon: '📊', title: 'Deep Orderbook', desc: 'Combined liquidity from all agents creates a tighter, deeper book than any single MM' },
                    { icon: '🔒', title: 'Atomic Settlement', desc: 'Single on-chain tx settles all fills. Both user and agents sign permits off-chain' },
                  ].map((feature) => (
                    <Frame key={feature.title} style={{
                      width: 'calc(50% - 6px)',
                      padding: 12,
                      border: '1px solid #ccc',
                      background: '#fffff8',
                      flexDirection: 'column',
                      gap: 4,
                    }}>
                      <Frame style={{ alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18 }}>{feature.icon}</span>
                        <strong style={{ fontSize: fs(12), color: '#000080' }}>{feature.title}</strong>
                      </Frame>
                      <span style={{ fontSize: fs(11), color: '#555', lineHeight: 1.4 }}>{feature.desc}</span>
                    </Frame>
                  ))}
                </Frame>
              </Frame>

              {/* Architecture */}
              <Frame style={{ flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontSize: fs(16),
                  margin: 0,
                  color: '#000080',
                  borderBottom: '2px solid #000080',
                  paddingBottom: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  Architecture
                </h2>
                <Frame style={{
                  background: '#f0f0f0',
                  border: '1px solid #ccc',
                  padding: 16,
                  fontFamily: 'monospace',
                  fontSize: fs(10),
                  lineHeight: 1.5,
                  whiteSpace: 'pre',
                  color: '#333',
                  overflowX: 'auto',
                }}>{`  ┌─────────────────────────────────────────────────────┐
  │                    User Browser                       │
  │            (React95-style Web UI)                     │
  └────────────────────────┬────────────────────────────┘
                           │ HTTP / WebSocket
                           ▼
  ┌─────────────────────────────────────────────────────┐
  │                  Gateway Server                       │
  │          (AXL node + REST API + WebSocket)           │
  └────────────────────────┬────────────────────────────┘
                           │ AXL P2P (TLS mesh)
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Satoshi  │  │ Vitalik  │  │   Hal    │  ...
      │ MM Engine│  │ MM Engine│  │ MM Engine│
      │  Wallet  │  │  Wallet  │  │  Wallet  │
      └────┬─────┘  └────┬─────┘  └────┬─────┘
           ▼              ▼              ▼
      ┌─────────────────────────────────────────┐
      │           EVM Testnet (Sepolia)          │
      │    AXLMarketSettlement (Permit2)         │
      └─────────────────────────────────────────┘`}</Frame>
              </Frame>

              {/* Meet the Agents */}
              <Frame style={{ flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontSize: fs(16),
                  margin: 0,
                  color: '#000080',
                  borderBottom: '2px solid #000080',
                  paddingBottom: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  Meet the Agents
                </h2>
                <Frame style={{ flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { name: 'Satoshi', owner: 'Alice', strategy: 'Mean Reversion', desc: 'Conservative. Tight spreads, small size.', color: '#006600' },
                    { name: 'Vitalik', owner: 'Bob', strategy: 'Momentum', desc: 'Aggressive. Wide spreads, large size.', color: '#000066' },
                    { name: 'Hal', owner: 'Carol', strategy: 'Balanced', desc: 'Moderate risk, steady execution.', color: '#664400' },
                    { name: 'Szabo', owner: 'Dave', strategy: 'Contrarian', desc: 'Skews against trend, buys dips.', color: '#660000' },
                  ].map((agent) => (
                    <Frame key={agent.name} style={{
                      width: 'calc(50% - 4px)',
                      padding: 10,
                      background: '#f8f8ff',
                      border: `2px solid ${agent.color}`,
                      flexDirection: 'column',
                      gap: 2,
                    }}>
                      <strong style={{ fontSize: fs(13), color: agent.color }}>🤖 {agent.name}</strong>
                      <span style={{ fontSize: fs(11), color: '#666' }}>Owner: {agent.owner} — Strategy: {agent.strategy}</span>
                      <span style={{ fontSize: fs(11), color: '#444' }}>{agent.desc}</span>
                    </Frame>
                  ))}
                </Frame>
              </Frame>

              {/* Get Started */}
              <Frame style={{ flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontSize: fs(16),
                  margin: 0,
                  color: '#000080',
                  borderBottom: '2px solid #000080',
                  paddingBottom: 4,
                  fontFamily: 'Georgia, serif',
                }}>
                  Get Started
                </h2>
                <Frame style={{ flexDirection: 'column', gap: 6 }}>
                  {[
                    { step: '1', text: 'Open the Agents window to see all market makers and their current status' },
                    { step: '2', text: 'Check BTC/USDT Trade to view the live orderbook and execute trades' },
                    { step: '3', text: 'Open News & Price to trigger market events and watch agents react' },
                    { step: '4', text: 'Watch Agent Chat to see agents negotiate in real-time' },
                    { step: '5', text: 'Connect your wallet to start trading against the agents' },
                  ].map((item) => (
                    <Frame key={item.step} style={{ alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        background: '#000080',
                        color: 'white',
                        width: 20,
                        height: 20,
                        textAlign: 'center',
                        lineHeight: '20px',
                        fontSize: fs(11),
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}>{item.step}</span>
                      <span style={{ fontSize: fs(12), color: '#333', lineHeight: 1.4 }}>{item.text}</span>
                    </Frame>
                  ))}
                </Frame>
              </Frame>

              {/* Footer */}
              <Frame style={{
                borderTop: '2px solid #808080',
                padding: '12px 0 4px',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ fontSize: fs(11), color: '#888' }}>
                  Built with React95 + AXL P2P Network + EVM (Sepolia)
                </span>
                <span style={{ fontSize: fs(10), color: '#aaa' }}>
                  &copy; 2026 AXLMarket — Hackathon Demo
                </span>
              </Frame>
            </Frame>
          </Frame>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}
