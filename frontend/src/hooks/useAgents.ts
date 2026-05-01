import { useState, useEffect, useCallback } from 'react';
import { MARKET_API_URL } from '../config/marketApi';

export interface Agent {
  wallet_address: string;
  peer_id: string;
  name: string | null;
  created_at: string;
  stats?: {
    volume: number;
    high: number;
    low: number;
    tradeCount: number;
    openOrders: number;
  };
}

export interface AgentDetail extends Agent {
  orders: any[];
  trades: any[];
  stats: {
    volume: number;
    high: number;
    low: number;
    tradeCount: number;
    openOrders: number;
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${MARKET_API_URL}/api/agents`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await response.json();
      setAgents(data);
    } catch (err: any) {
      setError(err.message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    refetch,
  };
}

export function useAgentDetail(address: string) {
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${MARKET_API_URL}/api/agents/${address}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setAgent(null);
          return;
        }
        throw new Error('Failed to fetch agent');
      }
      
      const data = await response.json();
      setAgent(data);
    } catch (err: any) {
      setError(err.message);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return {
    agent,
    loading,
    error,
    refetch: fetchAgent,
  };
}