import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WalletAgent } from "./agent/wallet";
import { getPeerId, getOrCreateAccount } from "./config";
import { AGENT_BOOK_TOOLS } from "./mcp"


/**
 * Creates an MCP server for AgentBook's Agent operations
 */

function createAgentBookMcpServer(agent: WalletAgent) {
    const server = new McpServer({
        name: "agentbook-mcp-server",
        version: "1.0.0"
    });

    // Register all tools
    for (const tool of AGENT_BOOK_TOOLS) {
        // Validate tool structure
        if (!tool.name || !tool.description || !tool.schema || !tool.handler) {
            console.error(`⚠️ Invalid tool structure for: ${tool.name}`);
            continue;
        }

        // Use registerTool with config object
        server.registerTool(
            tool.name,
            {
                title: tool.name,
                description: tool.description,
                inputSchema: tool.schema,
            },
            async (params: any): Promise<any> => {
                try {
                    const result = await tool.handler(agent, params);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(result, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    console.error(`Tool execution error [${tool.name}]:`, error);
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred",
                            },
                        ],
                    };
                }
            }
        );
    }

    console.error(`✅ Registered ${AGENT_BOOK_TOOLS.length} AgentBook tools`);
    return server;
}

async function main() {
    try {
        console.error("🔍 Starting AgentBook MCP Server...");

        // Get peer ID from environment
        const peerId = getPeerId();
        const account = getOrCreateAccount(peerId);
        const agent = new WalletAgent(peerId, account);

        console.error(`🤖 Agent: ${account.address} (peer: ${peerId.slice(0, 8)}...)`);

        // Create and start MCP server
        const server = createAgentBookMcpServer(agent);
        const transport = new StdioServerTransport();
        await server.connect(transport);

    } catch (error) {
        console.error('❌ Error starting AgentBook MCP server:', error);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down AgentBook MCP Server...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down AgentBook MCP Server...');
    process.exit(0);
});

// Start the server
main();