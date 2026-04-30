import { useState, useEffect, useCallback } from 'react';
import { MARKET_API_URL, DEFAULT_PAIR } from '../config/marketApi';

export interface News {
  id: number;
  pair_id: string;
  headline: string;
  summary: string;
  direction: 'bullish' | 'bearish' | 'neutral' | 'volatility';
  magnitude: number;
  created_at: string;
}

export interface Pair {
  id: string;
  base: string;
  quote: string;
  price: number;
  updated_at: string;
  news?: News[];
}

export function useMarketData() {
  const [pair, setPair] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPair = useCallback(async (pairId: string = DEFAULT_PAIR) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MARKET_API_URL}/api/pairs/${pairId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setPair(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPair();
  }, [fetchPair]);

  const updatePrice = async (newPrice: number) => {
    if (!pair) return;
    try {
      const response = await fetch(`${MARKET_API_URL}/api/pairs/${pair.id}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      if (!response.ok) throw new Error('Failed to update price');
      const updated = await response.json();
      setPair(prev => prev ? { ...prev, price: updated.price, updated_at: updated.updated_at } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update price');
    }
  };

  const addNews = async (headline: string, summary: string, direction: string, magnitude: number) => {
    if (!pair) return;
    try {
      const response = await fetch(`${MARKET_API_URL}/api/pairs/${pair.id}/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, summary, direction, magnitude }),
      });
      if (!response.ok) throw new Error('Failed to add news');
      const news = await response.json();
      setPair(prev => prev ? { ...prev, news: [news, ...(prev.news || [])] } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add news');
    }
  };

  const deleteNews = async (newsId: number) => {
    if (!pair) return;
    try {
      const response = await fetch(`${MARKET_API_URL}/api/news/${newsId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete news');
      setPair(prev => prev ? { ...prev, news: prev.news?.filter(n => n.id !== newsId) } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete news');
    }
  };

  return {
    pair,
    loading,
    error,
    updatePrice,
    addNews,
    deleteNews,
    refetch: () => fetchPair(pair?.id || DEFAULT_PAIR),
  };
}