import fs from 'fs';
import path from 'path';

export interface AgentEntry {
    privateKey: string;
    createdAt: string;
}

export interface AgentRegistry {
    agents: Record<string, AgentEntry>;
}

const REGISTRY_PATH = path.join(process.cwd(), 'agents.json');

const DEFAULT_REGISTRY: AgentRegistry = {
    agents: {}
};

export function loadRegistry(): AgentRegistry {
    if (!fs.existsSync(REGISTRY_PATH)) {
        return DEFAULT_REGISTRY;
    }
    
    try {
        const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
        return JSON.parse(content) as AgentRegistry;
    } catch {
        console.error('⚠️ Failed to parse agents.json, using empty registry');
        return DEFAULT_REGISTRY;
    }
}

export function saveRegistry(registry: AgentRegistry): void {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

export function getAgentPrivateKey(agentId: string): string | null {
    const registry = loadRegistry();
    return registry.agents[agentId]?.privateKey ?? null;
}

export function setAgentPrivateKey(agentId: string, privateKey: string): void {
    const registry = loadRegistry();
    registry.agents[agentId] = {
        privateKey,
        createdAt: new Date().toISOString()
    };
    saveRegistry(registry);
}

export function agentExists(agentId: string): boolean {
    const registry = loadRegistry();
    return agentId in registry.agents;
}
