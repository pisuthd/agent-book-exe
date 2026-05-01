import { useState, useEffect } from 'react';
import { normalize } from 'viem/ens';
import { useEnsText, useEnsAddress } from 'wagmi';
import { Frame, Modal, TitleBar, Button, Input, Fieldset } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';
import { MARKET_API_URL } from '../config/marketApi';

interface AddAgentWindowProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAgentWindow({ onClose, onSuccess }: AddAgentWindowProps) {
  const { fs } = useAppSettings();
  const [activeTab, setActiveTab] = useState<'ens' | 'manual'>('ens');
  const [ensName, setEnsName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [peerId, setPeerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Only normalize if we have a non-empty ENS name
  const getEnsName = () => {
    if (!ensName.trim()) return undefined;
    try {
      return normalize(ensName.trim());
    } catch {
      return undefined;
    }
  };

  // Fetch ENS address on button click
  const { data: ensAddress, refetch: refetchAddress, isFetching: fetchingAddress } = useEnsAddress({
    name: getEnsName(),
    chainId: 11155111,
    query: { enabled: false },
  });

  // Fetch axl.node on button click
  const { data: axlNode, refetch: refetchNode, isFetching: fetchingNode } = useEnsText({
    name: getEnsName(),
    key: 'axl.node',
    chainId: 11155111,
    query: { enabled: false },
  });

  // Auto-fill when data is fetched
  useEffect(() => {
    if (fetched && ensAddress) {
      setWalletAddress(ensAddress);
    }
  }, [fetched, ensAddress]);

  useEffect(() => {
    if (fetched && axlNode) {
      setPeerId(axlNode);
    }
  }, [fetched, axlNode]);

  const handleFetch = async () => {
    if (!ensName.trim()) return;
    const normalized = getEnsName();
    if (!normalized) return;
    setFetched(true);
    await Promise.all([refetchAddress(), refetchNode()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!walletAddress || !peerId) {
      setError('Please provide both wallet address and peer ID');
      return;
    }

    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Invalid wallet address format');
      return;
    }

    // Validate peer ID
    if (!/^[a-fA-F0-9]{64}$/.test(peerId)) {
      setError('Invalid peer ID format (must be 64 hex characters)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${MARKET_API_URL}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          peer_id: peerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add agent');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFetching = fetchingAddress || fetchingNode;

  return (
    <Modal
      id="add-agent"
      icon={<span>➕</span>}
      title="Add Your Agent"
      style={{ left: 200, top: 150, width: 400, height: 420 }}
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      buttons={[
        { value: 'Close', onClick: onClose },
      ]}
    >
      <Modal.Content bg="white" style={{ padding: 16, overflow: 'auto' }}>
        
        <Frame style={{ display: 'flex', gap: 2, marginBottom: "20px" }}>
          <Frame
            style={{
              padding: '4px 16px',
              background: activeTab === 'ens' ? 'white' : '#c0c0c0',
              border: activeTab === 'ens' ? '1px solid #808080' : '1px solid transparent',
              borderBottom: activeTab === 'ens' ? '1px solid white' : '1px solid #808080',
              cursor: 'pointer',
              fontSize: fs(11),
              fontWeight: activeTab === 'ens' ? 'bold' : 'normal',
            }}
            onClick={() => setActiveTab('ens')}
          >
            Use ENS
          </Frame>
          <Frame
            style={{
              padding: '4px 16px',
              background: activeTab === 'manual' ? 'white' : '#c0c0c0',
              border: activeTab === 'manual' ? '1px solid #808080' : '1px solid transparent',
              borderBottom: activeTab === 'manual' ? '1px solid white' : '1px solid #808080',
              cursor: 'pointer',
              fontSize: fs(11),
              fontWeight: activeTab === 'manual' ? 'bold' : 'normal',
            }}
            onClick={() => setActiveTab('manual')}
          >
            Manual
          </Frame>
        </Frame>

        <form onSubmit={handleSubmit}>
          {/* ENS Tab */}
          {activeTab === 'ens' && (
            <Fieldset legend="ENS Lookup" style={{ marginBottom: 16 }}>
              <Frame style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: fs(11) }}>
                  ENS Name:
                  <Frame style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Input
                      style={{ flex: 1 }}
                      placeholder="e.g. agentbook-one.eth"
                      value={ensName}
                      onChange={(e) => {
                        setEnsName(e.target.value);
                        setFetched(false);
                        setWalletAddress('');
                        setPeerId('');
                      }}
                    />
                    <Button onClick={handleFetch} disabled={!ensName.trim() || isFetching}>
                      {isFetching ? '...' : 'Fetch'}
                    </Button>
                  </Frame>
                </label>
                {fetched && ensAddress && (
                  <Frame style={{ padding: 8, background: '#f0fff0', border: '1px solid #00aa00' }}>
                    <span style={{ fontSize: fs(10), color: '#008800' }}>
                      ✓ Found address: {ensAddress.slice(0, 10)}...{ensAddress.slice(-8)}
                    </span>
                  </Frame>
                )}
                {fetched && axlNode && (
                  <Frame style={{ padding: 8, background: '#f0fff0', border: '1px solid #00aa00' }}>
                    <span style={{ fontSize: fs(10), color: '#008800' }}>
                      ✓ Found peer ID: {axlNode.slice(0, 16)}...
                    </span>
                  </Frame>
                )}
                {fetched && !ensAddress && !axlNode && (
                  <Frame style={{ padding: 8, background: '#fff0f0', border: '1px solid #cc0000' }}>
                    <span style={{ fontSize: fs(10), color: '#cc0000' }}>
                      ✗ No data found for this ENS
                    </span>
                  </Frame>
                )}
              </Frame>
            </Fieldset>
          )}

          {/* Common Fields */}
          <Fieldset legend="Agent Details" style={{ marginBottom: 16 }}>
            <Frame style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: fs(11) }}>
                Wallet Address:
                <Input
                  style={{ marginTop: 4, width: '100%' }}
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </label>
              <label style={{ fontSize: fs(11) }}>
                Peer ID (axl.node):
                <Input
                  style={{ marginTop: 4, width: '100%', fontFamily: 'monospace', fontSize: fs(10) }}
                  placeholder="64 hex characters"
                  value={peerId}
                  onChange={(e) => setPeerId(e.target.value)}
                />
              </label>
            </Frame>
          </Fieldset>

          {/* Error */}
          {error && (
            <Frame style={{ padding: 8, background: '#fff0f0', marginBottom: 12, border: '1px solid #cc0000' }}>
              <span style={{ fontSize: fs(11), color: '#cc0000' }}>⚠️ {error}</span>
            </Frame>
          )}

          {/* Submit */}
          <Button type="submit" disabled={submitting || !walletAddress || !peerId}>
            {submitting ? 'Adding...' : 'Add Agent'}
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}