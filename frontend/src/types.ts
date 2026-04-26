export interface AgentOrder {
  price: number;
  size: number;
  side: 'bid' | 'ask';
}

export interface RiskParams {
  maxPositionBtc: number;
  maxDrawdownPct: number;
  spreadBps: number;
  orderLevels: number;
  skewFactor: number;
  rebalanceIntervalSec: number;
}

export interface Performance {
  pnl: number;
  pnlPct: number;
  trades: number;
  winRate: number;
  avgSpreadBps: number;
}

export interface Agent {
  id: string;
  name: string;
  owner: string;
  avatar: string;
  description: string;
  strategy: string;
  btcBalance: number;
  usdtBalance: number;
  performance: Performance;
  status: 'active' | 'paused' | 'offline';
  lastUpdate: string;
  orders: AgentOrder[];
  riskParams: RiskParams;
  evmAddress: string;
}

export interface OrderbookEntry {
  price: number;
  size: number;
  agent: string;
  totalUsdt: number;
}

export interface Trade {
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
  time: string;
  filledBy: string[];
}

export type NewsDirection = 'bullish' | 'bearish' | 'neutral' | 'volatility';

export interface NewsReaction {
  agent: string;
  reaction: string;
}

export interface NewsEvent {
  headline: string;
  direction: NewsDirection;
  magnitudePct: number;
  timestamp: string;
  reactions: NewsReaction[];
}

export type ChatChannel = '#btc-usdt' | '#allocation' | '#risk-signals' | '#general';

export interface ChatMessage {
  channel: ChatChannel;
  from: string;
  text: string;
  timestamp: string;
  type: 'agent' | 'news' | 'system';
}

export interface Negotiation {
  id: string;
  description: string;
  status: 'AGREED' | 'PENDING' | 'REJECTED';
}

export interface WalletTx {
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  total: number;
  time: string;
}
