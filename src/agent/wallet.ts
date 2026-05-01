import { publicClient, config, SETTLEMENT_ADDRESS, createWalletClientForAccount } from '../config';
import { Address, formatUnits, parseUnits, type Account, type PublicClient, type WalletClient } from 'viem';
import { ERC20_ABI, MOCK_TOKEN_ABI } from '../contracts/erc20';

// Token configuration for Sepolia
export const TOKEN_CONFIGS = {
    WBTC: {
        address: '0x2Ad531B1fE90beF60F8C20d85092119C84904a76' as Address,
        decimals: 6
    },
    USDT: {
        address: '0x709bc83E7c65Dc9D4B4B24DDfE24D117DEde9924' as Address,
        decimals: 6
    }
} as const;

export class WalletAgent {
    public readonly peerId: string;
    public readonly nodeName: string;
    public readonly walletClient: WalletClient;
    public readonly publicClient: PublicClient;
    public readonly account: Account;

    constructor(peerId: string, nodeName: string, account: Account) {
        this.peerId = peerId;
        this.nodeName = nodeName;
        this.account = account;
        this.publicClient = publicClient;
        this.walletClient = createWalletClientForAccount(account);
    }

    get address(): Address {
        return this.account.address;
    }

    async getBalance(): Promise<string> {
        const balance = await publicClient.getBalance({ address: this.address });
        return formatUnits(balance, 18);
    }

    async getChainId(): Promise<number> {
        return config.chainId;
    }

    async getNetworkInfo() {
        return {
            chainId: config.chainId,
            rpcUrl: config.rpcProviderUrl,
            blockExplorer: config.blockExplorer,
            nativeCurrency: config.nativeCurrency
        };
    }

    // Get all token balances (ETH + ERC20 tokens)
    async getTokenBalances() {
        try {
            const tokens = [];
            
            // Get ETH balance
            const ethBalance = await publicClient.getBalance({ address: this.address });
            tokens.push({
                symbol: 'ETH',
                address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                balance: ethBalance.toString(),
                balanceFormatted: formatUnits(ethBalance, 18),
                decimals: 18
            });

            // Get ERC20 token balances
            for (const [symbol, tokenConfig] of Object.entries(TOKEN_CONFIGS)) {
                const balance = await publicClient.readContract({
                    address: tokenConfig.address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [this.address]
                }) as bigint;

                tokens.push({
                    symbol,
                    address: tokenConfig.address,
                    balance: balance.toString(),
                    balanceFormatted: formatUnits(balance, tokenConfig.decimals),
                    decimals: tokenConfig.decimals
                });
            }

            return {
                address: this.address,
                nativeBalance: tokens[0].balance,
                nativeBalanceFormatted: tokens[0].balanceFormatted,
                tokens: tokens.slice(1),
                network: {
                    chainId: config.chainId,
                    name: 'Sepolia',
                    rpcUrl: config.rpcProviderUrl
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get token balances: ${error.message}`);
        }
    }

    // Approve token to Settlement contract for trading
    async approveToken(tokenSymbol: string) {
        const symbol = tokenSymbol.toUpperCase();
        const tokenConfig = TOKEN_CONFIGS[symbol as keyof typeof TOKEN_CONFIGS];

        if (!tokenConfig) {
            throw new Error(`Token ${tokenSymbol} not supported. Available: WBTC, USDT`);
        }

        const settlementAddress = SETTLEMENT_ADDRESS;

        try {
            const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

            const txHash = await this.walletClient.writeContract({
                address: tokenConfig.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [settlementAddress, maxUint256],
                account: this.account
            } as any);

            return {
                status: 'success',
                transaction_hash: txHash,
                token_symbol: symbol,
                token_address: tokenConfig.address,
                spender: settlementAddress,
                amount: 'unlimited (max uint256)',
                explorer_url: `${config.blockExplorer}/tx/${txHash}`
            };
        } catch (error: any) {
            throw new Error(`Failed to approve ${symbol} for trading: ${error.message}`);
        }
    }

    // Sign a message
    async signMessage(message: string): Promise<string> {
        try {
            const signature = await this.walletClient.signMessage({
                account: this.account,
                message: message
            });
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign message: ${error.message}`);
        }
    }

    // Mint mock tokens
    async mintTokens(tokenSymbol: string, amount: string) {
        const symbol = tokenSymbol.toUpperCase();
        const tokenConfig = TOKEN_CONFIGS[symbol as keyof typeof TOKEN_CONFIGS];

        if (!tokenConfig) {
            throw new Error(`Token ${tokenSymbol} not supported. Available: WBTC, USDT`);
        }

        try {
            const decimals = tokenConfig.decimals;
            const amountWei = parseUnits(amount, decimals);

            const txHash = await this.walletClient.writeContract({
                address: tokenConfig.address,
                abi: MOCK_TOKEN_ABI,
                functionName: 'mint',
                args: [this.address, amountWei],
                account: this.account
            } as any);

            return {
                status: 'success',
                transaction_hash: txHash,
                token_symbol: symbol,
                amount: amountWei.toString(),
                amountFormatted: amount,
                recipient: this.address,
                explorer_url: `${config.blockExplorer}/tx/${txHash}`
            };
        } catch (error: any) {
            throw new Error(`Failed to mint ${symbol}: ${error.message}`);
        }
    }
}