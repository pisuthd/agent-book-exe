import { useState } from 'react';
import { Frame, Modal } from '@react95/core';
import { chatMessages, negotiations } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';
import type { ChatChannel } from '../types';

interface ChatWindowProps {
  onClose: () => void;
}

const channels: { name: ChatChannel; unread: number }[] = [
  { name: '#btc-usdt', unread: 5 },
  { name: '#allocation', unread: 0 },
  { name: '#risk-signals', unread: 0 },
  { name: '#general', unread: 0 },
];

export function ChatWindow({ onClose }: ChatWindowProps) {
  const { fs } = useAppSettings();
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('#btc-usdt');
  const filteredMessages = chatMessages.filter((m) => m.channel === activeChannel);

  return (
    <Modal
      id="chat"
      icon={<span>💬</span>}
      title="Agent Chat"
      style={{ left: 120, top: 60, width: 600, height: 420 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Frame style={{ display: 'flex', flex: 1, gap: 0 }}>
          {/* Channels sidebar */}
          <Frame style={{
            width: 120,
            borderRight: '2px solid #808080',
            padding: 4,
            flexDirection: 'column',
            gap: 0,
          }}>
            <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>Channels</strong>
            {channels.map((ch) => (
              <Frame
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                style={{
                  padding: '3px 6px',
                  cursor: 'pointer',
                  fontSize: fs(12),
                  background: activeChannel === ch.name ? '#000080' : 'transparent',
                  color: activeChannel === ch.name ? 'white' : 'black',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{ch.name}</span>
                {ch.unread > 0 && (
                  <span style={{
                    background: '#cc0000',
                    color: 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    fontSize: 9,
                    textAlign: 'center',
                    lineHeight: '16px',
                  }}>
                    {ch.unread}
                  </span>
                )}
              </Frame>
            ))}
          </Frame>

          {/* Messages */}
          <Frame style={{ flex: 1, padding: 6, flexDirection: 'column', overflowY: 'auto' }}>
            <strong style={{ fontSize: fs(12), marginBottom: 4, display: 'block' }}>{activeChannel}</strong>
            <Frame style={{ flexDirection: 'column', gap: 6 }}>
              {filteredMessages.map((msg, i) => (
                <Frame key={i} style={{ flexDirection: 'column', gap: 1 }}>
                  {msg.type === 'news' ? (
                    <Frame style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      padding: '4px 8px',
                      borderRadius: 2,
                    }}>
                      <span style={{ fontSize: fs(11), color: '#888' }}>[{msg.timestamp}]</span>
                      <span style={{ fontSize: fs(12), fontWeight: 'bold' }}> 📰 NEWS: {msg.text}</span>
                    </Frame>
                  ) : (
                    <Frame>
                      <span style={{ fontSize: fs(10), color: '#888' }}>[{msg.timestamp}]</span>
                      <span style={{ fontSize: fs(11), fontWeight: 'bold' }}> 🤖 {msg.from}:</span>
                      <span style={{ fontSize: fs(11) }}> {msg.text}</span>
                    </Frame>
                  )}
                </Frame>
              ))}
            </Frame>
          </Frame>
        </Frame>

        {/* Active Negotiations */}
        <Frame style={{
          borderTop: '2px solid #808080',
          padding: 6,
          marginTop: 4,
        }}>
          <strong style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>Active Negotiations</strong>
          <Frame style={{ flexDirection: 'column', gap: 2 }}>
            {negotiations.map((neg) => (
              <Frame key={neg.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fs(11) }}>
                <span>🔀</span>
                <span>{neg.description}</span>
                <span style={{
                  padding: '1px 6px',
                  fontSize: fs(10),
                  fontWeight: 'bold',
                  background: neg.status === 'AGREED' ? '#c0ffc0' : neg.status === 'PENDING' ? '#ffffc0' : '#ffc0c0',
                  border: '1px solid #808080',
                }}>
                  {neg.status}
                </span>
              </Frame>
            ))}
          </Frame>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}
