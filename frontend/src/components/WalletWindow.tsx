import { Frame, Modal, Fieldset, TitleBar, Button } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';
import { WalletConnectButton } from './WalletConnectButton';
import { useTokenBalances, TOKENS } from '../hooks/useTokens';

interface WalletWindowProps {
  onClose: () => void;
}

// Format large numbers with K/M suffix
const formatUSD = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 10_000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

export function WalletWindow({ onClose }: WalletWindowProps) {
  const { fs } = useAppSettings();
  const { address, isConnected, balances, totalUSD, mint, isMinting } = useTokenBalances();

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const statusColor = isConnected ? '#006600' : '#cc0000';
  const statusBg = isConnected ? '#c0ffc0' : '#fff0f0';

  return (
    <Modal
      id="wallet"
      icon={<span>👛</span>}
      title="Wallet"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 200, top: 80, width: 420, height: 420 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
        
        {/* Wallet + Status */}
        <Frame style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          background: statusBg,
          border: `1px solid ${statusColor}`,
        }}>
          <Frame style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WalletConnectButton />
            {/* {isConnected && (
              <Frame style={{ flexDirection: 'column' }}>
                <span style={{ fontSize: fs(11), fontWeight: 'bold' }}>{truncatedAddress}</span>
                <span style={{ fontSize: fs(9), color: '#666' }}>Sepolia</span>
              </Frame>
            )} */}
          </Frame>
          <span style={{ fontSize: fs(11), fontWeight: 'bold', color: statusColor }}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </Frame>

        {/* Portfolio with icons */}
        <Fieldset legend="Your Portfolio">
          {balances.map((token) => (
            <Frame key={token.symbol} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 4px',
              borderBottom: '1px solid #eee',
            }}>
              <img src={token.icon} alt={token.symbol} style={{ width: 20, height: 20, marginRight: 8 }} />
              <span style={{ fontSize: fs(12), fontWeight: 'bold', width: 50 }}>{token.symbol}</span>
              <span style={{ fontSize: fs(11), color: '#333', flex: 1, textAlign: 'center' }}>
                {token.amount >= 1000 
                  ? token.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) 
                  : token.amount.toFixed(2)}
              </span>
              <span style={{ fontSize: fs(11), color: '#008000', fontWeight: 'bold', minWidth: 90, textAlign: 'right' }}>
                {formatUSD(token.usdValue)}
              </span>
              {token.symbol !== 'ETH' && isConnected && (
                <Button 
                  style={{ fontSize: fs(9), padding: '2px 6px', marginLeft: 8 }}
                  onClick={() => mint(token as typeof TOKENS.BTC)}
                  disabled={isMinting}
                >
                  Mint
                </Button>
              )}
            </Frame>
          ))}
          <Frame style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0 0',
            marginTop: 4,
            borderTop: '2px solid #808080',
          }}>
            <span style={{ fontSize: fs(12), fontWeight: 'bold' }}>Total</span>
            <span style={{ fontSize: fs(14), fontWeight: 'bold', color: '#000080' }}>
              {formatUSD(totalUSD)}
            </span>
          </Frame>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}