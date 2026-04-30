import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getPeerId } from "../../config";

export const GetAccountTool: McpTool = {
    name: "get_account",
    description: "Get the current peer's account information including peer ID and wallet address",
    schema: {
        // No input parameters needed
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const peerId = getPeerId();
            const address = agent.address;

            return {
                status: "success",
                peer_id: peerId,
                address: address,
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