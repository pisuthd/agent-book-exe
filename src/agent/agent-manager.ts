import { WalletAgent } from './wallet';
import { buildAgentConfigs, getOrCreateAccount } from '../config';

export class AgentManager {
    private agents: Map<string, WalletAgent> = new Map();   // keyed by nodeName
    private defaultAgent: WalletAgent;

    constructor() {
        const configs = buildAgentConfigs();

        if (configs.length === 0) {
            throw new Error('No agents configured. Set PEER_IDS (or PEER_ID) environment variable.');
        }

        for (const { peerId, nodeName } of configs) {
            const account = getOrCreateAccount(peerId);
            const agent = new WalletAgent(peerId, nodeName, account);
            this.agents.set(nodeName, agent);
            console.error(`🤖 Agent: ${nodeName} → ${account.address} (peer: ${peerId.slice(0, 8)}...)`);
        }

        this.defaultAgent = this.agents.get(configs[0].nodeName)!;
        console.error(`✅ Default agent: ${configs[0].nodeName}`);
    }

    /** Resolve a WalletAgent by node name. Falls back to default if no name given. */
    resolve(agentName?: string): WalletAgent {
        if (!agentName) {
            return this.defaultAgent;
        }

        const agent = this.agents.get(agentName);
        if (!agent) {
            const available = Array.from(this.agents.keys()).join(', ');
            throw new Error(`Agent '${agentName}' not found. Available: ${available}`);
        }
        return agent;
    }

    /** Get the default agent (first in PEER_IDS array) */
    getDefault(): WalletAgent {
        return this.defaultAgent;
    }

    /** List all configured agents */
    listAgents(): Array<{ nodeName: string; peerId: string; address: string }> {
        return Array.from(this.agents.entries()).map(([nodeName, agent]) => ({
            nodeName,
            peerId: agent.peerId,
            address: agent.address,
        }));
    }
}