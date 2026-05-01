import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getPeerId } from "../../config";

export const GetAccountTool: McpTool = {
    name: "get_account",
    description: "Get the current peer's account information including peer ID, wallet address, and ENS name",
    schema: {
        // No input parameters needed
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const peerId = getPeerId();
            const address = agent.address;

            // Try to resolve ENS name
            let ensName: string | null = null;
            try {
                ensName = await agent.publicClient.getEnsName({ address });
            } catch {
                // ENS resolution failed
                ensName = null;
            }

            return {
                status: "success",
                peer_id: peerId,
                address: address,
                ens_name: ensName,
                display_name: ensName || address,
                network: {
                    chain_id: 11155111,
                    name: "Sepolia"
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get account: ${error.message}`);
        }
    }
};