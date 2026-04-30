import { useState, useCallback, useRef } from 'react';
import {
  Frame,
  Modal,
  TaskBar,
  List,
  Tooltip,
  TitleBar
} from '@react95/core';
import {  
  FolderExe2,
  FolderExe,
  MicrosoftExchange,
  MsDos,
  MicrosoftNetwork,
  WindowsExplorer,
  FolderFile,
  Settings,
  FolderSettings,
  FolderPrint,
  FileFind,
  HelpBook,
  LoaderBat,
  Computer3,
  Winmine1,
  Bookmark
} from '@react95/icons';
import type { Agent } from './types';
import { agents as allAgents } from './mockData';
import { useAppSettings } from './context/AppSettingsContext';
import { HomePageWindow } from './components/HomePageWindow';
import { AgentsWindow } from './components/AgentsWindow';
import { AgentDetailWindow } from './components/AgentDetailWindow';
import { TradeWindow } from './components/TradeWindow';
import { NewsWindow } from './components/NewsWindow';
import { ChatWindow } from './components/ChatWindow';
import { WalletWindow } from './components/WalletWindow';
import { SettingsWindow } from './components/SettingsWindow';
import { MinesweeperWindow } from './components/minesweeper/MinesweeperWindow';
import './App.css';

type WindowId = 'home' | 'agents' | 'trade' | 'news' | 'chat' | 'wallet' | 'about' | 'settings' | 'minesweeper';

const DESKTOP_ICONS: { id: WindowId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home Page', icon: '🌐' },
  { id: 'agents', label: 'Agents', icon: '🦞' },
  { id: 'trade', label: 'BTC/USDT', icon: '📊' },
  
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
  { id: 'minesweeper', label: 'Minesweeper', icon: <Winmine1 variant="32x32_4" /> },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

function App() {
  const { fs } = useAppSettings();
  const audioRef = useRef(new Audio('/win95.mp3'));
  const [openWindows, setOpenWindows] = useState<Set<WindowId>>(new Set());
  const [openAgentDetails, setOpenAgentDetails] = useState<Set<string>>(new Set());

  const playStartupSound = useCallback(() => {
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(() => { });
  }, []);

  const openWindow = useCallback((window: WindowId) => {
    if (window === 'about') {
      playStartupSound();
    }
    setOpenWindows((prev) => new Set(prev).add(window));
  }, [playStartupSound]);

  const closeWindow = useCallback((window: WindowId) => {
    setOpenWindows((prev) => {
      const next = new Set(prev);
      next.delete(window);
      return next;
    });
  }, []);

  const handleSelectAgent = useCallback((agent: Agent) => {
    setOpenAgentDetails((prev) => new Set(prev).add(agent.id));
  }, []);

  const handleCloseAgentDetail = useCallback((agentId: string) => {
    setOpenAgentDetails((prev) => {
      const next = new Set(prev);
      next.delete(agentId);
      return next;
    });
  }, []);

  return (
    <Frame
      width="100vw"
      height="100vh"
      style={{
        background: '#008080',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Desktop Icons */}
      <Frame
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {DESKTOP_ICONS.map((icon) => (
          <Tooltip key={icon.id} text={`Open ${icon.label}`} delay={500}>
            <Frame
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                width: 72,
              }}
              onClick={() => openWindow(icon.id)}
              onDoubleClick={() => openWindow(icon.id)}
            >
              <span style={{ fontSize: 32 }}>{icon.icon}</span>
              <span
                style={{
                  color: 'white',
                  fontSize: fs(11),
                  textAlign: 'center',
                  textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                  marginTop: 2,
                  lineHeight: 1.2,
                }}
              >
                {icon.label}
              </span>
            </Frame>
          </Tooltip>
        ))}
      </Frame>

      {/* Home Page — IE-style full screen */}
      {openWindows.has('home') && (
        <HomePageWindow onClose={() => closeWindow('home')} />
      )}

      {/* Agents Window */}
      {openWindows.has('agents') && (
        <AgentsWindow
          onSelectAgent={handleSelectAgent}
          onClose={() => closeWindow('agents')}
        />
      )}

      {/* Agent Detail Windows — multiple at once */}
      {Array.from(openAgentDetails).map((agentId, index) => {
        const agent = allAgents.find((a) => a.id === agentId);
        if (!agent) return null;
        return (
          <AgentDetailWindow
            key={agentId}
            agent={agent}
            onClose={() => handleCloseAgentDetail(agentId)}
            offsetIndex={index}
          />
        );
      })}

      {/* Trade Window */}
      {openWindows.has('trade') && (
        <TradeWindow onClose={() => closeWindow('trade')} />
      )}

      {/* News Window */}
      {openWindows.has('news') && (
        <NewsWindow onClose={() => closeWindow('news')} />
      )}

      {/* Chat Window */}
      {openWindows.has('chat') && (
        <ChatWindow onClose={() => closeWindow('chat')} />
      )}

      {/* Wallet Window */}
      {openWindows.has('wallet') && (
        <WalletWindow onClose={() => closeWindow('wallet')} />
      )}

      {/* Settings Window */}
      {openWindows.has('settings') && (
        <SettingsWindow onClose={() => closeWindow('settings')} />
      )}

      {/* Minesweeper Window */}
      {openWindows.has('minesweeper') && (
        <MinesweeperWindow onClose={() => closeWindow('minesweeper')} />
      )}

      {/* About Window */}
      {openWindows.has('about') && (
        <Modal
          id="about"
          icon={<span>ℹ️</span>}
          title="About"
          titleBarOptions={<TitleBar.Close onClick={() => closeWindow('about')} />}
          buttons={[
            // { value: 'Home Page', onClick: () => openWindow('home') },
            { value: 'Close', onClick: () => closeWindow('about') },
          ]}
          style={{
            left: 120,
            top: 140,
            width: 340,
          }}
        >
          <Modal.Content
            bg="white"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 16,
            }}
          >
            <Bookmark variant="32x32_4" />
            <h2
              style={{
                margin: 0,
                fontSize: fs(16),
                fontFamily: 'MS Sans Serif, sans-serif',
              }}
            >
              AgentBook.exe v1.0
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: fs(12),
                textAlign: 'center',
                color: '#444',
              }}
            >
              An orderbook DEX backed by a P2P network of autonomous market makers on AXL.
              <br />
               Now live on Ethereum Sepolia
            </p>
            <Frame
              style={{
                borderTop: '1px solid #ccc',
                paddingTop: 8,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: fs(11), color: '#888' }}>
                Built with React95 + AXL
                <br />
                &copy; 2026 AgentBook
              </span>
            </Frame>
          </Modal.Content>
        </Modal>
      )}

      {/* TaskBar */}
      <TaskBar
        list={
          <List width={'200px'}> 
            <List.Item icon={<FolderExe2 variant="32x32_4" />}>
              <List width={'200px'}>
                <List.Item icon={<FolderExe variant="16x16_4" />}>
                  Accessories
                </List.Item>
                <List.Item icon={<FolderExe variant="16x16_4" />}>StartUp</List.Item>
                <List.Item icon={<MicrosoftExchange variant="16x16_4" />}>
                  Microsoft Exchange
                </List.Item>
                <List.Item icon={<MsDos variant="16x16_32" />}>
                  MS-DOS Prompt
                </List.Item>
                <List.Item icon={<MicrosoftNetwork variant="16x16_4" />}>
                  The Microsoft Network
                </List.Item>
                <List.Item icon={<WindowsExplorer variant="16x16_4" />}>
                  Windows Explorer
                </List.Item>
              </List>
              Programs
            </List.Item>
            <List.Item icon={<FolderFile variant="32x32_4" />}>Documents</List.Item>
            <List.Item icon={<Settings variant="32x32_4" />}>
              <List width={'200px'}>
                <List.Item icon={<FolderSettings variant="16x16_4" />}>
                  Control Panel
                </List.Item>
                <List.Item icon={<FolderPrint variant="16x16_4" />}>
                  Printers
                </List.Item>
              </List>
              Settings
            </List.Item>
            <List.Item icon={<FileFind variant="32x32_4" />}>Find</List.Item>
            <List.Item icon={<HelpBook variant="32x32_4" />}>Help</List.Item>
            <List.Item icon={<LoaderBat variant="32x32_4" />}>Run...</List.Item>
            <List.Divider />
            <List.Item icon={<Computer3 variant="32x32_4" />}>Shut Down...</List.Item>
          </List>
        }
      />
    </Frame>
  );
}

export default App;
