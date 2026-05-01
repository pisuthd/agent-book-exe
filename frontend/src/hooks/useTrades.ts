import { useState, useEffect, useCallback } from 'react';
import { MARKET_API_URL } from '../config/marketApi';

export interface Trade {
  id: number;
  tx_hash: string;
  user_address: string;
  side: 'buy' | 'sell';
  base_amount: number;
  quote_amount: number;
  price: number;
  created_at: string;
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${MARKET_API_URL}/api/trades?limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      
      const data = await response.json();
      setTrades(data);
    } catch (err: any) {
      setError(err.message);
      // Fallback to empty array
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    loading,
    error,
    refetch,
  };
}

// Helper to format trade time (handles UTC dates from backend)
export function formatTradeTime(dateStr: string): string {
  // Force UTC parsing by appending 'Z' if not already present
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

// Trade stats interface
export interface TradeStats {
  volume: number;
  high: number;
  low: number;
  tradeCount: number;
  lastPrice: number;
}

// Fetch trade stats (24h volume, high, low)
export function useTradeStats() {
  const [stats, setStats] = useState<TradeStats>({
    volume: 0,
    high: 0,
    low: 0,
    tradeCount: 0,
    lastPrice: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MARKET_API_URL}/api/trades/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch trade stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
