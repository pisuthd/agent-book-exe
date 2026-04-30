import { sepolia } from 'viem/chains'
import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount, generatePrivateKey, type Account } from 'viem/accounts';
import { toHex } from 'viem';
import { getAgentPrivateKey, setAgentPrivateKey, agentExists } from './agent-registry';

// Sepolia configuration
export const config = {
    chain: sepolia,
    chainId: sepolia.id, // 11155111
    rpcProviderUrl: process.env.RPC_URL || 'https://sepolia.drpc.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH'
};

// Get or create agent ID from environment
const getAgentId = (): string => {
    const agentId = process.env.AGENT_ID;
    if (!agentId) {
        throw new Error('AGENT_ID environment variable is required');
    }
    return agentId;
};

// Initialize account from agent registry or create new one
const getAccount = (): Account => {
    const agentId = getAgentId();
    
    // Check if agent already exists in registry
    let privateKey = getAgentPrivateKey(agentId);
    
    if (!privateKey) {
        // Generate new wallet for this agent
        console.error(`🔑 Agent '${agentId}' not found in registry. Creating new wallet...`);
        const newPrivateKey = toHex(generatePrivateKey());
        setAgentPrivateKey(agentId, newPrivateKey);
        privateKey = newPrivateKey;
        console.error(`✅ New wallet created and saved for agent '${agentId}'`);
    } else {
        console.error(`🔑 Using existing wallet for agent '${agentId}'`);
    }

    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    return privateKeyToAccount(formattedKey as `0x${string}`);
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
