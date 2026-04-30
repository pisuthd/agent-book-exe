import { useState, useEffect, useCallback } from 'react';
import { MARKET_API_URL } from '../config/marketApi';

export interface Order {
  id: string;
  address: string;
  peer_id: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  signature: string;
  created_at: string;
}

export interface GroupedOrder {
  price: number;
  totalSize: number;
  totalUsdt: number;
  orders: Order[];
}

export interface AggregatedOrders {
  bids: GroupedOrder[];
  asks: GroupedOrder[];
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
}

function groupOrdersByPrice(orders: Order[], side: 'bid' | 'ask'): GroupedOrder[] {
  const filtered = orders.filter(o => o.side === side);
  const grouped = filtered.reduce((acc, order) => {
    const key = order.price;
    if (!acc[key]) {
      acc[key] = { price: key, totalSize: 0, totalUsdt: 0, orders: [] };
    }
    acc[key].totalSize += order.size;
    acc[key].totalUsdt += order.size * order.price;
    acc[key].orders.push(order);
    return acc;
  }, {} as Record<number, GroupedOrder>);

  const result = Object.values(grouped).sort((a, b) => 
    side === 'bid' ? b.price - a.price : a.price - b.price
  );
  
  return result;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MARKET_API_URL}/api/orders`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Aggregate orders by price level
  const aggregated: AggregatedOrders = {
    bids: groupOrdersByPrice(orders, 'bid'),
    asks: groupOrdersByPrice(orders, 'ask'),
    bestBid: orders.filter(o => o.side === 'bid').reduce((max, o) => Math.max(max, o.price), 0) || null,
    bestAsk: orders.filter(o => o.side === 'ask').reduce((min, o) => Math.min(min, o.price), Infinity) || null,
    spread: null,
  };

  if (aggregated.bestBid && aggregated.bestAsk && aggregated.bestAsk !== Infinity) {
    aggregated.spread = aggregated.bestAsk - aggregated.bestBid;
  }

  return {
    orders,
    aggregated,
    loading,
    error,
    refetch: fetchOrders,
  };
}