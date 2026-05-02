import { z } from "zod";
import { type McpTool } from "../../types";
import { type WalletAgent } from "../../agent/wallet";

export const GetAccountTool: McpTool = {
    name: "get_account",
    description: "Get account information. Returns peer ID, wallet address, and ENS name.",
    schema: {},
    handler: async (agent: WalletAgent, _input: Record<string, any>) => {
        try {
            const peerId = agent.peerId;
            const address = agent.address;

            // Try to resolve ENS name
            let ensName: string | null = null;
            try {
                ensName = await agent.publicClient.getEnsName({ address });
            } catch {
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