import { sepolia } from 'viem/chains'
import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount, generatePrivateKey, type Account } from 'viem/accounts';
import { getPeerPrivateKey, setPeerPrivateKey } from './agent-registry';

// Backend configuration
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// P2P node configuration
export const P2P_NODE_URL = process.env.P2P_NODE_URL || 'http://127.0.0.1:9002';

// Sepolia configuration
export const config = {
    chain: sepolia,
    chainId: sepolia.id, // 11155111
    rpcProviderUrl: process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/46BFnBkjDdWActWG5HvRV',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH'
};

// Contract addresses (Sepolia)
export const SETTLEMENT_ADDRESS = '0xe3CeB910F779dE87F4716f9290dC41FCdd85b45B';
export const WBTC_ADDRESS = '0x2Ad531B1fE90beF60F8C20d85092119C84904a76';
export const USDT_ADDRESS = '0x709bc83E7c65Dc9D4B4B24DDfE24D117DEde9924';

// Validate PEER_ID format (64 hex characters, no 0x prefix)
function isValidPeerId(peerId: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(peerId);
}

// Get peer ID from environment
export const getPeerId = (): string => {
    const peerId = process.env.PEER_ID;
    if (!peerId) {
        throw new Error('PEER_ID environment variable is required');
    }
    if (!isValidPeerId(peerId)) {
        throw new Error('PEER_ID must be exactly 64 hexadecimal characters (no 0x prefix)');
    }
    return peerId;
};

// Initialize account from peer registry or create new one
const getAccount = (): Account => {
    const peerId = getPeerId();
    
    // Check if peer already exists in registry
    let privateKey = getPeerPrivateKey(peerId);
    
    if (!privateKey) {
        // Generate new wallet for this peer
        console.error(`🔑 Peer '${peerId.slice(0, 8)}...' not found in registry. Creating new wallet...`);
        const newPrivateKey = generatePrivateKey(); // Returns hex string with "0x" prefix
        privateKey = newPrivateKey;
        
        // Create temporary account to get address
        const tempAccount = privateKeyToAccount(newPrivateKey as `0x${string}`);
        const address = tempAccount.address;
        
        setPeerPrivateKey(peerId, newPrivateKey, address);
        console.error(`✅ New wallet created and saved for peer '${peerId.slice(0, 8)}...'`);
        console.error(`📍 Address: ${address}`);
    } else {
        console.error(`🔑 Using existing wallet for peer '${peerId.slice(0, 8)}...'`);
    }

    // privateKey is already hex string with "0x" prefix from generatePrivateKey
    return privateKeyToAccount(privateKey as `0x${string}`);
};

export const account: Account = getAccount();

// Initialize clients
const baseConfig = {
    chain: config.chain,
    transport: http(config.rpcProviderUrl),
};

export const publicClient: PublicClient = createPublicClient(baseConfig);

export const walletClient: WalletClient = createWalletClient({
    ...baseConfig,
    account,
});

// Validate environment on startup
export function validateEnvironment(): void {
    console.error(`✅ MCP Server configuration valid`);
    console.error(`📍 Network: Sepolia (Chain ID: ${config.chainId})`);
    console.error(`📍 RPC URL: ${config.rpcProviderUrl}`);
    console.error(`📍 Block Explorer: ${config.blockExplorer}`);
    console.error(`📍 Account: ${account.address}`);
}