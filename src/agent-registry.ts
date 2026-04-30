import fs from 'fs';
import path from 'path';
import os from 'os';

export interface PeerEntry {
    privateKey: string;
    address: string;
    createdAt: string;
}

export interface PeerRegistry {
    peers: Record<string, PeerEntry>;
}

// Use fixed path in user's home directory, not cwd
const AGENTBOOK_DIR = path.join(os.homedir(), '.agentbook');
const REGISTRY_PATH = path.join(AGENTBOOK_DIR, 'peers.json');

const DEFAULT_REGISTRY: PeerRegistry = {
    peers: {}
};

// Ensure directory exists
function ensureDir(): void {
    if (!fs.existsSync(AGENTBOOK_DIR)) {
        fs.mkdirSync(AGENTBOOK_DIR, { recursive: true });
    }
}

export function loadRegistry(): PeerRegistry {
    ensureDir();
    
    if (!fs.existsSync(REGISTRY_PATH)) {
        return DEFAULT_REGISTRY;
    }
    
    try {
        const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
        return JSON.parse(content) as PeerRegistry;
    } catch {
        console.error('⚠️ Failed to parse peers.json, using empty registry');
        return DEFAULT_REGISTRY;
    }
}

export function saveRegistry(registry: PeerRegistry): void {
    ensureDir();
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

export function getPeerPrivateKey(peerId: string): string | null {
    const registry = loadRegistry();
    return registry.peers[peerId]?.privateKey ?? null;
}

export function setPeerPrivateKey(peerId: string, privateKey: string, address: string): void {
    const registry = loadRegistry();
    // Ensure key is properly formatted with 0x prefix
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    registry.peers[peerId] = {
        privateKey: formattedKey,
        address: address,
        createdAt: new Date().toISOString()
    };
    saveRegistry(registry);
}

export function peerExists(peerId: string): boolean {
    const registry = loadRegistry();
    return peerId in registry.peers;
}

export function getPeerAddress(peerId: string): string | null {
    const registry = loadRegistry();
    return registry.peers[peerId]?.address ?? null;
}