import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import {   getDefaultConfig } from '@rainbow-me/rainbowkit'; 

// WalletConnect project ID - get one free from https://cloud.walletconnect.com
const projectId = 'YOUR_PROJECT_ID';

export const wagmiConfig = getDefaultConfig({
  appName: 'AgentBook',
  projectId: projectId || 'demo',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});