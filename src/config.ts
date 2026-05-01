import { sepolia } from 'viem/chains'
import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Account } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
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

// Agent configuration
export interface AgentConfig {
    peerId: string;
    nodeName: string;
}

// Parse PEER_IDS from environment (comma-separated)
export function parsePeerIds(): string[] {
    const raw = process.env.PEER_IDS;
    if (!raw) {
        // Fallback to single PEER_ID for backwards compatibility
        const single = process.env.PEER_ID;
        if (single) {
            if (!isValidPeerId(single)) {
                throw new Error('PEER_ID must be exactly 64 hexadecimal characters (no 0x prefix)');
            }
            return [single];
        }
        throw new Error('PEER_IDS (or PEER_ID) environment variable is required');
    }

    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
        throw new Error('PEER_IDS must contain at least one peer ID');
    }

    for (const id of ids) {
        if (!isValidPeerId(id)) {
            throw new Error(`Invalid PEER_ID '${id.slice(0, 8)}...' — must be exactly 64 hexadecimal characters (no 0x prefix)`);
        }
    }

    return ids;
}

// Parse NODE_IDS from environment (comma-separated human-friendly names)
export function parseNodeIds(): string[] {
    const raw = process.env.NODE_IDS;
    if (!raw) {
        return []; // Will default to peer_id-based names
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// Build agent configs by zipping PEER_IDS and NODE_IDS
export function buildAgentConfigs(): AgentConfig[] {
    const peerIds = parsePeerIds();
    const nodeIds = parseNodeIds();

    if (nodeIds.length > 0 && nodeIds.length !== peerIds.length) {
        throw new Error(`NODE_IDS count (${nodeIds.length}) must match PEER_IDS count (${peerIds.length})`);
    }

    return peerIds.map((peerId, i) => ({
        peerId,
        nodeName: nodeIds[i] || `agent-${peerId.slice(0, 8)}`,
    }));
}

// Create or retrieve account for a peer from registry
export function getOrCreateAccount(peerId: string): Account {
    let privateKey = getPeerPrivateKey(peerId);

    if (!privateKey) {
        console.error(`🔑 Peer '${peerId.slice(0, 8)}...' not found in registry. Creating new wallet...`);
        const newPrivateKey = generatePrivateKey();
        privateKey = newPrivateKey;

        const tempAccount = privateKeyToAccount(newPrivateKey as `0x${string}`);
        const address = tempAccount.address;

        setPeerPrivateKey(peerId, newPrivateKey, address);
        console.error(`✅ New wallet created for peer '${peerId.slice(0, 8)}...'`);
        console.error(`📍 Address: ${address}`);
    } else {
        console.error(`🔑 Using existing wallet for peer '${peerId.slice(0, 8)}...'`);
    }

    return privateKeyToAccount(privateKey as `0x${string}`);
}

// Create a wallet client for a specific account
export function createWalletClientForAccount(account: Account): WalletClient {
    return createWalletClient({
        chain: config.chain,
        transport: http(config.rpcProviderUrl),
        account,
    });
}

// Shared public client (no account needed)
export const publicClient: PublicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcProviderUrl),
});