import { sepolia } from 'viem/chains'
import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount, type Account } from 'viem/accounts';

// Sepolia configuration
export const config = {
    chain: sepolia,
    chainId: sepolia.id, // 11155111
    rpcProviderUrl: process.env.RPC_URL || 'https://sepolia.drpc.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH'
};

// Initialize account from environment variable
const getAccount = (): Account => {
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
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
