const express = require("express");
const { execFile } = require("child_process");

const REGISTRY_URL = "http://127.0.0.1:9003";
const SERVICE_NAME = "openclaw-gateway";
const PORT = 7100;

const app = express();
app.use(express.json());

function parseAgent(name) {
    return name.replace(/\./g, "-");
}

function runAgent(args) {
    return new Promise((resolve, reject) => {
        const agent = parseAgent(args.agent || "");
        const message = args.message || "";
        const sessionId = args["session-id"] || "";

        if (!agent || !message) {
            return reject(new Error("'agent' and 'message' are required"));
        }

        const cmdArgs = ["agent", "--agent", agent, "--message", message];
        if (sessionId) {
            cmdArgs.push("--session-id", sessionId); // seems the OpenClaw CLI doesn't separate sessions
        }

        execFile("openclaw", cmdArgs, { timeout: 600_000 }, (err, stdout, stderr) => {
            if (err) {
                return reject(new Error(stderr || err.message));
            }
            resolve(stdout.trim());
        });
    });
}

app.post("/mcp", async (req, res) => {
    const msg = req.body;

    if (msg.method === "tools/list") {
        return res.json({
            jsonrpc: "2.0",
            id: msg.id,
            result: {
                tools: [
                    {
                        name: "agent",
                        description: "Run an OpenClaw agent turn",
                        inputSchema: {
                            type: "object",
                            properties: {
                                agent: { type: "string", description: "Agent name (e.g. agentbook-one.eth)" },
                                message: { type: "string", description: "Message to send to the agent" },
                                "session-id": { type: "string", description: "Session ID for conversation continuity" },
                            },
                            required: ["agent", "message"],
                        },
                    },
                ],
            },
        });
    }

    if (msg.method === "tools/call") {
        try {
            const args = msg?.params || {};
            const output = await runAgent(args);
            return res.json({
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                    content: [{ type: "text", text: output }],
                },
            });
        } catch (e) {
            return res.json({
                jsonrpc: "2.0",
                id: msg.id,
                error: { code: -32000, message: e.message },
            });
        }
    }

    res.status(400).json({ error: "unknown method" });
});

const server = app.listen(PORT, "127.0.0.1", async () => {
    console.log(`OpenClaw MCP gateway on http://127.0.0.1:${PORT}`);

    try {
        const resp = await fetch(`${REGISTRY_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service: SERVICE_NAME,
                endpoint: `http://127.0.0.1:${PORT}/mcp`,
            }),
        });
        console.log(`Registered: ${resp.status}`);
    } catch (e) {
        console.error(`Registration failed: ${e.message}`);
    }
});

async function shutdown() {
    console.log("\nShutting down...");

    try {
        const resp = await fetch(`${REGISTRY_URL}/register/${SERVICE_NAME}`, {
            method: "DELETE",
        });
        console.log(`Deregistered: ${resp.status}`);
    } catch (e) {
        console.error(`Deregistration failed: ${e.message}`);
    }

    server.close(() => {
        console.log("Server stopped");
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);