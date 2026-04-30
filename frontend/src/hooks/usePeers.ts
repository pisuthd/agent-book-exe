import { useState, useEffect, useCallback } from 'react';
import { MARKET_API_URL } from '../config/marketApi';

export interface Peer {
  id: string;
  public_key: string;
  source: 'default' | 'user';
}

export function usePeers() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MARKET_API_URL}/api/peers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setPeers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch peers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  const addPeer = async (publicKey: string) => {
    try {
      const response = await fetch(`${MARKET_API_URL}/api/peers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_key: publicKey }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add peer');
      }
      
      await fetchPeers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add peer');
      return false;
    }
  };

  const deletePeer = async (id: string) => {
    try {
      const response = await fetch(`${MARKET_API_URL}/api/peers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete peer');
      }
      
      await fetchPeers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete peer');
      return false;
    }
  };

  return {
    peers,
    loading,
    error,
    addPeer,
    deletePeer,
    refetch: fetchPeers,
  };
}