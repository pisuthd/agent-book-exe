import { publicClient, walletClient, account, config } from '../config';
import { Address, formatUnits, parseUnits } from 'viem';
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
    // Expose clients for direct use in MCP tools
    public readonly walletClient = walletClient;
    public readonly publicClient = publicClient;
    public readonly account = account;

    get address(): Address {
        return account.address;
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

    // Approve token to Permit2 contract
    async approveToPermit2(tokenSymbol: string) {
        const symbol = tokenSymbol.toUpperCase();
        const tokenConfig = TOKEN_CONFIGS[symbol as keyof typeof TOKEN_CONFIGS];

        if (!tokenConfig) {
            throw new Error(`Token ${tokenSymbol} not supported. Available: WBTC, USDT`);
        }

        // Permit2 address on Sepolia
        const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address;

        try {
            const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

            const txHash = await walletClient.writeContract({
                address: tokenConfig.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [permit2Address, maxUint256],
                account: account
            } as any);

            return {
                status: 'success',
                transaction_hash: txHash,
                token_symbol: symbol,
                token_address: tokenConfig.address,
                spender: permit2Address,
                amount: 'unlimited (max uint256)',
                explorer_url: `${config.blockExplorer}/tx/${txHash}`
            };
        } catch (error: any) {
            throw new Error(`Failed to approve ${symbol} to Permit2: ${error.message}`);
        }
    }

    // Get Permit2 nonce for the agent
    async getPermit2Nonce(tokenSymbol: string) {
        const symbol = tokenSymbol.toUpperCase();
        const tokenConfig = TOKEN_CONFIGS[symbol as keyof typeof TOKEN_CONFIGS];

        if (!tokenConfig) {
            throw new Error(`Token ${tokenSymbol} not supported. Available: WBTC, USDT`);
        }

        try {
            const nonce = await publicClient.readContract({
                address: tokenConfig.address,
                abi: [
                    {
                        inputs: [{ name: 'owner', type: 'address' }],
                        name: 'nonces',
                        outputs: [{ name: '', type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function'
                    }
                ],
                functionName: 'nonces',
                args: [this.address]
            }) as bigint;

            return {
                status: 'success',
                token_symbol: symbol,
                token_address: tokenConfig.address,
                owner: this.address,
                nonce: nonce.toString(),
                nonce_bigint: nonce
            };
        } catch (error: any) {
            throw new Error(`Failed to get Permit2 nonce: ${error.message}`);
        }
    }

    // Get inventory with skew calculation
    async getInventory() {
        try {
            const btcBalance = await publicClient.readContract({
                address: TOKEN_CONFIGS.WBTC.address,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [this.address]
            }) as bigint;

            const usdtBalance = await publicClient.readContract({
                address: TOKEN_CONFIGS.USDT.address,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [this.address]
            }) as bigint;

            const btcFormatted = formatUnits(btcBalance, TOKEN_CONFIGS.WBTC.decimals);
            const usdtFormatted = formatUnits(usdtBalance, TOKEN_CONFIGS.USDT.decimals);

            // Calculate inventory skew
            // Target: equal value in BTC and USDT
            // BTC value = btc * mid_price, USDT value = usdt
            const midPrice = 64000; // Approximate mid price
            const btcValue = Number(btcFormatted) * midPrice;
            const usdtValue = Number(usdtFormatted);
            
            // Skew: positive = long BTC, negative = short BTC
            const totalValue = (btcValue + usdtValue) / 2;
            const targetBtcValue = totalValue;
            const targetUsdtValue = totalValue;
            
            const skew = (btcValue - targetBtcValue) / targetBtcValue;
            
            // Preference based on skew
            let preference: 'neutral' | 'want_to_sell' | 'want_to_buy';
            if (Math.abs(skew) < 0.1) {
                preference = 'neutral';
            } else if (skew > 0) {
                preference = 'want_to_sell';
            } else {
                preference = 'want_to_buy';
            }

            return {
                status: 'success',
                address: this.address,
                btc: {
                    balance: btcBalance.toString(),
                    balance_formatted: btcFormatted,
                    decimals: TOKEN_CONFIGS.WBTC.decimals,
                    value_usdt: btcValue
                },
                usdt: {
                    balance: usdtBalance.toString(),
                    balance_formatted: usdtFormatted,
                    decimals: TOKEN_CONFIGS.USDT.decimals
                },
                inventory_skew: skew,
                preference,
                mid_price_used: midPrice
            };
        } catch (error: any) {
            throw new Error(`Failed to get inventory: ${error.message}`);
        }
    }

    // Sign a message
    async signMessage(message: string): Promise<string> {
        try {
            const signature = await walletClient.signMessage({
                account: account,
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

            const txHash = await walletClient.writeContract({
                address: tokenConfig.address,
                abi: MOCK_TOKEN_ABI,
                functionName: 'mint',
                args: [this.address, amountWei],
                account: account
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
