import { z } from "zod";
import { execFile } from "child_process";
import { type McpTool } from "../../types";
import { type WalletAgent } from "../../agent/wallet";
import { P2P_NODE_URL } from "../../config";

interface P2PRequest {
    jsonrpc: string;
    method: string;
    id: number;
    params: {
        agent: string;
        "session-id": string;
        message: string;
    };
}

interface P2PResponse {
    jsonrpc: string;
    id: number;
    result?: {
        content?: Array<{ type: string; text: string }>;
    };
    error?: {
        code: number;
        message: string;
    };
}

export const SendMessageTool: McpTool = {
    name: "send_message",
    description: "Send a message to another agent via P2P network. The message will be prefixed with your agent name.",
    schema: {
        peer_id: z.string()
            .describe("The target agent's peer ID (64 hex characters)"),
        agent: z.string()
            .describe("The target agent's ENS name (e.g., 'agentbook-one.eth')"),
        message: z.string()
            .describe("The message to send to the target agent"),
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { peer_id: targetPeerId, agent: targetAgent, message } = input;
            const address = agent.address;

            // Try to resolve ENS name
            let myName: string;
            try {
                const ensName = await agent.publicClient.getEnsName({ address });
                myName = ensName || address;
            } catch {
                // ENS resolution failed, use address
                myName = address;
            }

            // Prefix message with sender name
            const prefixedMessage = `[${myName}] ${message}`;

            // Build P2P request
            const p2pRequest: P2PRequest = {
                jsonrpc: "2.0",
                method: "tools/call",
                id: 1,
                params: {
                    agent: targetAgent,
                    "session-id": "1234", // any ID will be routed to each agent's default session
                    message: prefixedMessage
                }
            };

            const url = `${P2P_NODE_URL}/mcp/${targetPeerId}/openclaw-gateway`;
            const body = JSON.stringify(p2pRequest);

            // Helper to execute curl as fallback
            const curlFetch = async (url: string, body: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    execFile("curl", ["-s", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", body], { timeout: 120_000 }, (err, stdout, stderr) => {
                        if (err) return reject(new Error(stderr || err.message));
                        resolve(stdout);
                    });
                });
            };

            let p2pResponse: P2PResponse;

            // try {
            //     // Try fetch first
            //     const response = await fetch(url, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body
            //     });

            //     if (!response.ok) {
            //         throw new Error(`P2P gateway error: ${response.status} ${response.statusText}`);
            //     }

            //     p2pResponse = await response.json() as P2PResponse;
            // } catch (fetchError: any) {
            //     console.error(`fetch failed: ${fetchError.message}, retrying with curl...`);

            //     // Fallback to curl
            //     const curlOutput = await curlFetch(url, body);
            //     p2pResponse = JSON.parse(curlOutput) as P2PResponse;
            // }

            const curlOutput = await curlFetch(url, body);
            p2pResponse = JSON.parse(curlOutput) as P2PResponse;

            // Extract response text
            let responseText = "No response";
            if (p2pResponse.result?.content) {
                responseText = p2pResponse.result.content.map(c => c.text).join('\n');
            } else if (p2pResponse.error) {
                responseText = `Error: ${p2pResponse.error.message}`;
            }

            return {
                status: "success",
                from: myName,
                to: targetAgent,
                target_peer_id: targetPeerId,
                message: prefixedMessage,
                response: responseText
            };
        } catch (error: any) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
};