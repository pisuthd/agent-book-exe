import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset, TitleBar } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';
import { usePeers } from '../hooks/usePeers';

interface PeerListWindowProps {
  onClose: () => void;
}

export function PeerListWindow({ onClose }: PeerListWindowProps) {
  const { fs } = useAppSettings();
  const { peers, loading, error, addPeer, deletePeer, refetch } = usePeers();
  const [newPeerKey, setNewPeerKey] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const defaultPeers = peers.filter(p => p.source === 'default');
  const userPeers = peers.filter(p => p.source === 'user');

  const handleAddPeer = async () => {
    if (newPeerKey.length !== 64) {
      setAddError('Must be 64 hex characters');
      return;
    }
    if (!/^[a-fA-F0-9]+$/.test(newPeerKey)) {
      setAddError('Must be valid hex');
      return;
    }
    
    setAddError(null);
    const success = await addPeer(newPeerKey);
    if (success) {
      setNewPeerKey('');
    }
  };

  const handleDeletePeer = async (id: string) => {
    await deletePeer(id);
  };

  return (
    <Modal
      id="peerlist"
      icon={<span>🔗</span>}
      title="Peer List"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 300, top: 80, width: 480, height: 420 }}
      buttons={[
        { value: 'Refresh', onClick: refetch },
        { value: 'Close', onClick: onClose },
      ]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto', padding: 8 }}>
        
        {/* Error */}
        {(error || addError) && (
          <Frame style={{ 
            padding: 8, 
            background: '#fff0f0', 
            border: '1px solid #cc0000',
            marginBottom: 8,
          }}>
            <span style={{ color: '#cc0000', fontSize: fs(10) }}>
              {addError || error}
            </span>
          </Frame>
        )}

        {/* Add Peer Input */}
        <Frame style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          <Input
            value={newPeerKey}
            onChange={(e) => { setNewPeerKey(e.target.value); setAddError(null); }}
            placeholder="Enter 64-char public key..."
            style={{ flex: 1, fontSize: fs(10), fontFamily: 'monospace' }}
          />
          <Button 
            onClick={handleAddPeer}
            disabled={newPeerKey.length !== 64}
            style={{ fontSize: fs(10) }}
          >
            Add
          </Button>
        </Frame>

        {/* Default Peers */}
        <Fieldset legend={`Default Peers (${defaultPeers.length})`} style={{ marginBottom: 12 }}>
          <Frame style={{ maxHeight: 100, overflow: 'auto' }}>
            {defaultPeers.map((peer) => (
              <Frame key={peer.id} style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px 6px',
                borderBottom: '1px solid #eee',
              }}>
                <span style={{ 
                  fontSize: fs(10), 
                  fontFamily: 'monospace',
                  color: '#888',
                  flex: 1,
                }}>
                  {peer.public_key.slice(0, 16)}...{peer.public_key.slice(-8)}
                </span>
                <span style={{ 
                  fontSize: fs(9), 
                  color: '#888',
                  fontStyle: 'italic',
                }}>
                  default
                </span>
              </Frame>
            ))}
            {defaultPeers.length === 0 && (
              <span style={{ fontSize: fs(10), color: '#888' }}>No default peers</span>
            )}
          </Frame>
        </Fieldset>

        {/* User Peers */}
        <Fieldset legend={`User Peers (${userPeers.length})`}>
          <Frame style={{ maxHeight: 150, overflow: 'auto' }}>
            {userPeers.length === 0 && (
              <span style={{ fontSize: fs(10), color: '#888' }}>No user peers added</span>
            )}
            {userPeers.map((peer) => (
              <Frame key={peer.id} style={{ 
                display: 'flex', 
                alignItems: 'center',
                padding: '4px 6px',
                borderBottom: '1px solid #eee',
              }}>
                <span style={{ 
                  fontSize: fs(10), 
                  fontFamily: 'monospace',
                  color: '#333',
                  flex: 1,
                }}>
                  {peer.public_key.slice(0, 16)}...{peer.public_key.slice(-8)}
                </span>
                <Button
                  onClick={() => handleDeletePeer(peer.id)}
                  style={{ 
                    fontSize: fs(9), 
                    padding: '0px 4px',
                    minWidth: 'auto',
                    color: '#cc0000',
                  }}
                >
                  ×
                </Button>
              </Frame>
            ))}
          </Frame>
        </Fieldset>

        {/* Loading */}
        {loading && (
          <Frame style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ fontSize: fs(10), color: '#888' }}>Loading...</span>
          </Frame>
        )}
      </Modal.Content>
    </Modal>
  );
}