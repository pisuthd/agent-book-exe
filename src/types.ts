import { z } from 'zod';

export interface McpTool {
    name: string;
    description: string;
    schema: Record<string, any>;
    handler: (agent: any, input: Record<string, any>) => Promise<any>;
}

export interface TokenBalance {
    symbol: string;
    address: string;
    balance: string;
    balanceFormatted: string;
    decimals: number;
}

export interface WalletTokenInfo {
    address: string;
    nativeBalance: string;
    nativeBalanceFormatted: string;
    tokens: TokenBalance[];
    network: {
        chainId: number;
        name: string;
        rpcUrl: string;
    };
}

export interface MintResult {
    status: string;
    transaction_hash: string;
    token_symbol: string;
    amount: string;
    amountFormatted: string;
    recipient: string;
    explorer_url: string;
}
