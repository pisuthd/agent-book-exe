import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export interface Order {
    id: string;
    side: 'bid' | 'ask';
    price: number;
    size: number;
    createdAt: string;
}

export interface PeerOrders {
    orders: Order[];
    updatedAt: string;
}

export interface OrdersRegistry {
    [peerId: string]: PeerOrders;
}

// Use fixed path in user's home directory, not cwd
const AGENTBOOK_DIR = path.join(os.homedir(), '.agentbook');
const ORDERS_PATH = path.join(AGENTBOOK_DIR, 'peer-orders.json');

// Ensure directory exists
function ensureDir(): void {
    if (!fs.existsSync(AGENTBOOK_DIR)) {
        fs.mkdirSync(AGENTBOOK_DIR, { recursive: true });
    }
}

export function loadOrders(): OrdersRegistry {
    ensureDir();
    
    if (!fs.existsSync(ORDERS_PATH)) {
        return {};
    }
    
    try {
        const content = fs.readFileSync(ORDERS_PATH, 'utf-8');
        return JSON.parse(content) as OrdersRegistry;
    } catch {
        console.error('⚠️ Failed to parse peer-orders.json, using empty registry');
        return {};
    }
}

export function saveOrders(registry: OrdersRegistry): void {
    ensureDir();
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

export function getOrders(peerId: string): Order[] {
    const registry = loadOrders();
    return registry[peerId]?.orders || [];
}

export function addOrder(peerId: string, side: 'bid' | 'ask', price: number, size: number): Order {
    const registry = loadOrders();
    
    if (!registry[peerId]) {
        registry[peerId] = { orders: [], updatedAt: new Date().toISOString() };
    }

    const order: Order = {
        id: randomUUID(),
        side,
        price,
        size,
        createdAt: new Date().toISOString()
    };

    registry[peerId].orders.push(order);
    registry[peerId].updatedAt = new Date().toISOString();
    saveOrders(registry);

    return order;
}

export function cancelOrder(peerId: string, orderId: string): boolean {
    const registry = loadOrders();
    
    if (!registry[peerId]) {
        return false;
    }

    const orders = registry[peerId].orders;
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) {
        return false;
    }

    orders.splice(index, 1);
    registry[peerId].updatedAt = new Date().toISOString();
    saveOrders(registry);

    return true;
}

export function clearOrders(peerId: string): void {
    const registry = loadOrders();
    
    if (registry[peerId]) {
        registry[peerId].orders = [];
        registry[peerId].updatedAt = new Date().toISOString();
        saveOrders(registry);
    }
}