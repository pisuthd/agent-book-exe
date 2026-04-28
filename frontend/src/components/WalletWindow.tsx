import { Frame, Modal, Button, Fieldset, TitleBar } from '@react95/core';
import { walletTxs } from '../mockData';
import { useAppSettings } from '../context/AppSettingsContext';

interface WalletWindowProps {
  onClose: () => void;
}

export function WalletWindow({ onClose }: WalletWindowProps) {
  const { fs } = useAppSettings();

  return (
    <Modal
      id="wallet"
      icon={<span>👛</span>}
      title="Wallet"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 200, top: 80, width: 400, height: 360 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto' }}>
        {/* Connection Info */}
        <Frame style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid #ccc',
        }}>
          <Frame style={{ flexDirection: 'column' }}>
            <span style={{ fontSize: fs(12) }}><strong>Connected:</strong> 0x1234...5678</span>
            <span style={{ fontSize: fs(11), color: '#666' }}>Network: Sepolia Testnet</span>
          </Frame>
          <Frame style={{
            padding: '2px 8px',
            background: '#c0ffc0',
            border: '1px solid #008000',
            fontSize: fs(11),
            fontWeight: 'bold',
            color: '#006600',
          }}>
            ● Connected
          </Frame>
        </Frame>

        {/* Balances */}
        <Fieldset legend="Your Balances" style={{ marginBottom: 12 }}>
          <table style={{ fontSize: fs(13), width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold' }}>WBTC:</td>
                <td style={{ textAlign: 'right' }}>0.00</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>USDT:</td>
                <td style={{ textAlign: 'right' }}>100,000.00</td>
              </tr>
            </tbody>
          </table>
        </Fieldset>

        {/* Recent Transactions */}
        <Fieldset legend="Recent Transactions" style={{ marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs(11) }}>
            <thead>
              <tr style={{ background: '#c0c0c0' }}>
                <th style={{ padding: '2px 6px' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '2px 6px' }}>Amount</th>
                <th style={{ textAlign: 'right', padding: '2px 6px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '2px 6px' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '2px 6px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {walletTxs.map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{
                    padding: '2px 6px',
                    fontWeight: 'bold',
                    color: tx.type === 'BUY' ? '#008000' : '#cc0000',
                  }}>
                    {tx.type}
                  </td>
                  <td style={{ textAlign: 'right', padding: '2px 6px' }}>{tx.amount.toFixed(2)} BTC</td>
                  <td style={{ textAlign: 'right', padding: '2px 6px' }}>@ {tx.price.toLocaleString()} avg</td>
                  <td style={{ textAlign: 'right', padding: '2px 6px' }}>
                    {tx.type === 'SELL' ? '+' : '-'}{tx.total.toLocaleString()} USDT
                  </td>
                  <td style={{ textAlign: 'right', padding: '2px 6px' }}>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Fieldset>

        {/* Actions */}
        <Frame style={{ display: 'flex', gap: 4 }}>
          <Button style={{ fontSize: fs(11) }}>💰 Deposit</Button>
          <Button style={{ fontSize: fs(11) }}>💸 Withdraw</Button>
          <Button style={{ fontSize: fs(11) }}>🔗 View on Explorer</Button>
        </Frame>
      </Modal.Content>
    </Modal>
  );
}
