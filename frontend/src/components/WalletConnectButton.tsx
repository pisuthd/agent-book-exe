import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Frame } from '@react95/core';
// import { useAccount } from 'wagmi';
import { useAppSettings } from '../context/AppSettingsContext';

export function WalletConnectButton() {
  const { fs } = useAppSettings();
  // const {
  //   address,
  //   isConnected 
  // } = useAccount();

  // const truncatedAddress = address 
  //   ? `${address.slice(0, 6)}...${address.slice(-4)}`
  //   : null;

  return (
    <Frame
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '4px 8px',
        background: '#c0c0c0',
        borderTop: '2px solid #404040',
        borderLeft: '2px solid #404040',
        borderRight: '2px solid white',
        borderBottom: '2px solid white',
      }}
    >
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: { opacity: 0, pointerEvents: 'none' },
              })}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                width: '100%',
              }}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      style={{
                        fontSize: fs(11),
                        padding: '4px 12px',
                        background: '#000080',
                        color: 'white',
                        border: 'none',
                        borderTop: '2px solid white',
                        borderLeft: '2px solid white',
                        borderRight: '2px solid #404040',
                        borderBottom: '2px solid #404040',
                        cursor: 'pointer',
                      }}
                    >
                      🔗 Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      style={{
                        fontSize: fs(11),
                        padding: '4px 12px',
                        background: '#cc0000',
                        color: 'white',
                        border: 'none',
                        borderTop: '2px solid white',
                        borderLeft: '2px solid white',
                        borderRight: '2px solid #404040',
                        borderBottom: '2px solid #404040',
                        cursor: 'pointer',
                      }}
                    >
                      Wrong Network
                    </button>
                  );
                }

                return (
                  <>
                    <button
                      onClick={openChainModal}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: fs(11),
                        padding: '4px 8px',
                        background: '#008000',
                        color: 'white',
                        border: 'none',
                        borderTop: '2px solid white',
                        borderLeft: '2px solid white',
                        borderRight: '2px solid #404040',
                        borderBottom: '2px solid #404040',
                        cursor: 'pointer',
                      }}
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            borderRadius: '50%',
                            width: 12,
                            height: 12,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      style={{
                        fontSize: fs(11),
                        padding: '4px 8px',
                        background: '#c0c0c0',
                        color: 'black',
                        border: 'none',
                        borderTop: '2px solid #404040',
                        borderLeft: '2px solid #404040',
                        borderRight: '2px solid white',
                        borderBottom: '2px solid white',
                        cursor: 'pointer',
                      }}
                    >
                      🌈 {account.displayName}
                    </button>
                  </>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {/* {isConnected && truncatedAddress && (
        <Frame style={{
          padding: '2px 8px',
          background: '#c0ffc0',
          border: '1px solid #008000',
          fontSize: fs(10),
        }}>
          <span style={{ fontWeight: 'bold' }}>{truncatedAddress}</span>
        </Frame>
      )} */}
    </Frame>
  );
}