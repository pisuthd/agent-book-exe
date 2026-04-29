import { Frame, Modal, Fieldset, TitleBar } from '@react95/core';
import { useAccount, useBalance } from 'wagmi';
import { useAppSettings } from '../context/AppSettingsContext';
import { WalletConnectButton } from './WalletConnectButton';

interface WalletWindowProps {
  onClose: () => void;
}

const PRICES = { ETH: 2500, WBTC: 95000, USDT: 1 };

interface TokenBalance {
  symbol: string;
  amount: number;
  price: number;
}

export function WalletWindow({ onClose }: WalletWindowProps) {
  const { fs } = useAppSettings();
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const ethAmount = ethBalance ? Number(ethBalance.value.toString()) / 1e18 : 0;

  const balances: TokenBalance[] = [
    { symbol: 'ETH', amount: ethAmount, price: PRICES.ETH },
    { symbol: 'WBTC', amount: 1.2345, price: PRICES.WBTC },
    { symbol: 'USDT', amount: 10000, price: PRICES.USDT },
  ];

  const totalUSD = balances.reduce((sum, b) => sum + b.amount * b.price, 0);
  const statusColor = isConnected ? '#006600' : '#cc0000';
  const statusBg = isConnected ? '#c0ffc0' : '#fff0f0';

  return (
    <Modal
      id="wallet"
      icon={<span>🦊</span>}
      title="Wallet"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 200, top: 80, width: 380, height: "auto" }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>

        <WalletConnectButton />
  
        {/* Portfolio */}
        <Fieldset legend="Your Portfolio">
          {balances.map((token) => (
            <Frame key={token.symbol} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: '1px solid #eee',
            }}>
              <span style={{ fontSize: fs(12), fontWeight: 'bold', width: 50 }}>{token.symbol}</span>
              <span style={{ fontSize: fs(11), color: '#333', flex: 1, textAlign: 'center' }}>
                {token.amount >= 1000 ? token.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : token.amount.toFixed(4)}
              </span>
              <span style={{ fontSize: fs(11), color: '#008000', fontWeight: 'bold' }}>
                ${(token.amount * token.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
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
              ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </Frame>
        </Fieldset>

        {/* Wallet + Status   */}
        <Frame style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          background: statusBg,
          border: `1px solid ${statusColor}`,
        }}>
           <span style={{ fontSize: fs(11), fontWeight: 'bold', color: statusColor }}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
          <Frame style={{ display: 'flex', alignItems: 'center', gap: 12 }}> 
            {isConnected && (
              <Frame style={{ flexDirection: 'column' }}>
                <span style={{ fontSize: fs(11), fontWeight: 'bold' }}>{truncatedAddress}</span>
                {` `}
                <span style={{ fontSize: fs(9), color: '#666' }}>Sepolia</span>
              </Frame>
            )}
          </Frame>
         
        </Frame>
      </Modal.Content>
    </Modal>
  );
}