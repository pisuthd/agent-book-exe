import { publicClient, walletClient, account, config } from '../config';
import { Address, formatUnits } from 'viem';

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
}
