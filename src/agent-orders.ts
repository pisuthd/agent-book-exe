import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface Order {
    id: string;
    side: 'bid' | 'ask';
    price: number;
    size: number;
    createdAt: string;
}

export interface AgentOrders {
    orders: Order[];
    updatedAt: string;
}

export interface OrdersRegistry {
    [agentId: string]: AgentOrders;
}

const ORDERS_PATH = path.join(process.cwd(), 'agent-orders.json');

export function loadOrders(): OrdersRegistry {
    if (!fs.existsSync(ORDERS_PATH)) {
        return {};
    }
    
    try {
        const content = fs.readFileSync(ORDERS_PATH, 'utf-8');
        return JSON.parse(content) as OrdersRegistry;
    } catch {
        console.error('⚠️ Failed to parse agent-orders.json, using empty registry');
        return {};
    }
}

export function saveOrders(registry: OrdersRegistry): void {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

export function getOrders(agentId: string): Order[] {
    const registry = loadOrders();
    return registry[agentId]?.orders || [];
}

export function addOrder(agentId: string, side: 'bid' | 'ask', price: number, size: number): Order {
    const registry = loadOrders();
    
    if (!registry[agentId]) {
        registry[agentId] = { orders: [], updatedAt: new Date().toISOString() };
    }

    const order: Order = {
        id: randomUUID(),
        side,
        price,
        size,
        createdAt: new Date().toISOString()
    };

    registry[agentId].orders.push(order);
    registry[agentId].updatedAt = new Date().toISOString();
    saveOrders(registry);

    return order;
}

export function cancelOrder(agentId: string, orderId: string): boolean {
    const registry = loadOrders();
    
    if (!registry[agentId]) {
        return false;
    }

    const orders = registry[agentId].orders;
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) {
        return false;
    }

    orders.splice(index, 1);
    registry[agentId].updatedAt = new Date().toISOString();
    saveOrders(registry);

    return true;
}

export function clearOrders(agentId: string): void {
    const registry = loadOrders();
    
    if (registry[agentId]) {
        registry[agentId].orders = [];
        registry[agentId].updatedAt = new Date().toISOString();
        saveOrders(registry);
    }
}
