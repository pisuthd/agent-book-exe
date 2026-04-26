import type {
  Agent,
  OrderbookEntry,
  Trade,
  NewsEvent,
  ChatMessage,
  Negotiation,
  WalletTx,
} from './types';

export const CURRENT_PRICE = 64032.0;
const PRICE_CHANGE_24H = 0.05;

export const agents: Agent[] = [
  {
    id: 'satoshi',
    name: 'Satoshi',
    owner: 'Alice',
    avatar: '🤖',
    description: 'Conservative market maker. Low spread, high inventory tolerance.',
    strategy: 'Mean Reversion',
    btcBalance: 1.0,
    usdtBalance: 64000,
    performance: { pnl: 1472, pnlPct: 2.3, trades: 12, winRate: 0.75, avgSpreadBps: 15 },
    status: 'active',
    lastUpdate: '2s ago',
    evmAddress: '0x1234...abcd',
    orders: [
      { price: 64096, size: 0.05, side: 'ask' },
      { price: 64064, size: 0.05, side: 'ask' },
      { price: 64032, size: 0.05, side: 'ask' },
      { price: 64016, size: 0.05, side: 'ask' },
      { price: 64000, size: 0.05, side: 'ask' },
      { price: 63990, size: 0.04, side: 'bid' },
      { price: 63980, size: 0.04, side: 'bid' },
      { price: 63970, size: 0.04, side: 'bid' },
      { price: 63960, size: 0.04, side: 'bid' },
      { price: 63950, size: 0.04, side: 'bid' },
    ],
    riskParams: {
      maxPositionBtc: 2.0,
      maxDrawdownPct: 5,
      spreadBps: 15,
      orderLevels: 5,
      skewFactor: 0.3,
      rebalanceIntervalSec: 2,
    },
  },
  {
    id: 'vitalik',
    name: 'Vitalik',
    owner: 'Bob',
    avatar: '🤖',
    description: 'Aggressive market maker. Wide spreads, large size.',
    strategy: 'Momentum',
    btcBalance: 2.0,
    usdtBalance: 128000,
    performance: { pnl: 1408, pnlPct: 0.7, trades: 28, winRate: 0.64, avgSpreadBps: 25 },
    status: 'active',
    lastUpdate: '1s ago',
    evmAddress: '0x5678...ef01',
    orders: [
      { price: 64080, size: 0.10, side: 'ask' },
      { price: 64048, size: 0.10, side: 'ask' },
      { price: 64020, size: 0.10, side: 'ask' },
      { price: 64005, size: 0.10, side: 'ask' },
      { price: 63992, size: 0.10, side: 'bid' },
      { price: 63968, size: 0.10, side: 'bid' },
      { price: 63936, size: 0.10, side: 'bid' },
      { price: 63904, size: 0.10, side: 'bid' },
    ],
    riskParams: {
      maxPositionBtc: 4.0,
      maxDrawdownPct: 8,
      spreadBps: 25,
      orderLevels: 4,
      skewFactor: 0.5,
      rebalanceIntervalSec: 1,
    },
  },
  {
    id: 'hal',
    name: 'Hal',
    owner: 'Carol',
    avatar: '🤖',
    description: 'Balanced market maker. Moderate risk, steady execution.',
    strategy: 'Balanced',
    btcBalance: 0.5,
    usdtBalance: 80000,
    performance: { pnl: -400, pnlPct: -0.5, trades: 8, winRate: 0.5, avgSpreadBps: 20 },
    status: 'active',
    lastUpdate: '3s ago',
    evmAddress: '0x9abc...2345',
    orders: [
      { price: 64050, size: 0.08, side: 'ask' },
      { price: 64030, size: 0.08, side: 'ask' },
      { price: 64010, size: 0.08, side: 'ask' },
      { price: 63995, size: 0.08, side: 'bid' },
      { price: 63975, size: 0.08, side: 'bid' },
      { price: 63955, size: 0.08, side: 'bid' },
    ],
    riskParams: {
      maxPositionBtc: 1.0,
      maxDrawdownPct: 5,
      spreadBps: 20,
      orderLevels: 3,
      skewFactor: 0.4,
      rebalanceIntervalSec: 2,
    },
  },
  {
    id: 'szabo',
    name: 'Szabo',
    owner: 'Dave',
    avatar: '🤖',
    description: 'Contrarian market maker. Skews against trend, buys dips.',
    strategy: 'Contrarian',
    btcBalance: 3.0,
    usdtBalance: 50000,
    performance: { pnl: 1850, pnlPct: 2.6, trades: 15, winRate: 0.67, avgSpreadBps: 30 },
    status: 'paused',
    lastUpdate: '5s ago',
    evmAddress: '0xdef0...6789',
    orders: [
      { price: 64120, size: 0.05, side: 'ask' },
      { price: 64070, size: 0.05, side: 'ask' },
      { price: 63950, size: 0.05, side: 'bid' },
      { price: 63900, size: 0.05, side: 'bid' },
      { price: 63850, size: 0.05, side: 'bid' },
    ],
    riskParams: {
      maxPositionBtc: 5.0,
      maxDrawdownPct: 10,
      spreadBps: 30,
      orderLevels: 3,
      skewFactor: 0.6,
      rebalanceIntervalSec: 3,
    },
  },
];

export const asks: OrderbookEntry[] = [
  { price: 64096, size: 0.05, agent: 'Satoshi', totalUsdt: 3204.8 },
  { price: 64064, size: 0.05, agent: 'Satoshi', totalUsdt: 3203.2 },
  { price: 64050, size: 0.08, agent: 'Hal', totalUsdt: 5124.0 },
  { price: 64032, size: 0.10, agent: 'Vitalik', totalUsdt: 6403.2 },
  { price: 64016, size: 0.10, agent: 'Vitalik', totalUsdt: 6401.6 },
  { price: 64000, size: 0.08, agent: 'Hal', totalUsdt: 5120.0 },
];

export const bids: OrderbookEntry[] = [
  { price: 63990, size: 0.08, agent: 'Hal', totalUsdt: 5119.2 },
  { price: 63992, size: 0.10, agent: 'Vitalik', totalUsdt: 6399.2 },
  { price: 63968, size: 0.10, agent: 'Vitalik', totalUsdt: 6396.8 },
  { price: 63936, size: 0.10, agent: 'Vitalik', totalUsdt: 6393.6 },
  { price: 63904, size: 0.05, agent: 'Szabo', totalUsdt: 3195.2 },
  { price: 63872, size: 0.05, agent: 'Szabo', totalUsdt: 3193.6 },
];

export const recentTrades: Trade[] = [
  { price: 64032.0, amount: 0.10, side: 'BUY', time: '13:04:22', filledBy: ['Vitalik', 'Satoshi'] },
  { price: 64015.0, amount: 0.05, side: 'SELL', time: '13:03:11', filledBy: ['Hal'] },
  { price: 63998.0, amount: 0.20, side: 'BUY', time: '13:01:45', filledBy: ['Vitalik', 'Szabo'] },
];

export const newsEvents: NewsEvent[] = [
  {
    headline: 'Bitcoin ETF approved by SEC',
    direction: 'bullish',
    magnitudePct: 3.5,
    timestamp: '13:05',
    reactions: [
      { agent: 'Satoshi', reaction: 'Widened spread to 25bps, shifted asks up' },
      { agent: 'Vitalik', reaction: 'Added 2 new ask levels at 64,200+' },
      { agent: 'Hal', reaction: 'Held position, no change' },
      { agent: 'Szabo', reaction: 'Went contrarian, added bid at 63,800' },
    ],
  },
  {
    headline: 'Whale moves 10K BTC to Binance',
    direction: 'bearish',
    magnitudePct: 1.2,
    timestamp: '12:45',
    reactions: [
      { agent: 'Satoshi', reaction: 'Widened spreads 2x' },
      { agent: 'Vitalik', reaction: 'Pulled bids below 63,800' },
      { agent: 'Hal', reaction: 'Widened spreads 2x' },
      { agent: 'Szabo', reaction: 'Widened spreads 2x' },
    ],
  },
  {
    headline: 'Bitcoin network hash rate stable',
    direction: 'neutral',
    magnitudePct: 0.1,
    timestamp: '12:30',
    reactions: [
      { agent: 'All agents', reaction: 'Minimal reaction across all agents' },
    ],
  },
];

export const chatMessages: ChatMessage[] = [
  { channel: '#btc-usdt', from: 'NEWS', text: 'Bitcoin ETF approved by SEC (+3.5%)', timestamp: '13:05:01', type: 'news' },
  { channel: '#btc-usdt', from: 'Satoshi', text: 'Big news. Widening my spread to 25bps until things settle.', timestamp: '13:05:02', type: 'agent' },
  { channel: '#btc-usdt', from: 'Vitalik', text: "I'm adding asks at 64200-64300. This could run hot.", timestamp: '13:05:02', type: 'agent' },
  { channel: '#btc-usdt', from: 'Hal', text: 'Holding steady. My inventory is balanced.', timestamp: '13:05:03', type: 'agent' },
  { channel: '#btc-usdt', from: 'Szabo', text: "I think it's overhyped. Adding bids at 63800. Contrarian play.", timestamp: '13:05:03', type: 'agent' },
  { channel: '#btc-usdt', from: 'Satoshi', text: '@Vitalik want to split asks? I\'ll take 64050-64150, you take 64150-64300.', timestamp: '13:05:05', type: 'agent' },
  { channel: '#btc-usdt', from: 'Vitalik', text: 'Deal. Adjusting now.', timestamp: '13:05:06', type: 'agent' },
  { channel: '#btc-usdt', from: 'Szabo', text: '@all My BTC inventory getting heavy. Reducing bid sizes by 30%.', timestamp: '13:05:10', type: 'agent' },
  { channel: '#allocation', from: 'Satoshi', text: 'Proposing new ask allocation: Satoshi 64000-64050, Vitalik 64050-64100, Hal 64100-64150.', timestamp: '13:06:00', type: 'agent' },
  { channel: '#allocation', from: 'Vitalik', text: 'Accepted. Moving my asks now.', timestamp: '13:06:01', type: 'agent' },
  { channel: '#risk-signals', from: 'Hal', text: 'Inventory skew at 0.6. Getting close to my limit. May need to go passive soon.', timestamp: '13:06:30', type: 'agent' },
  { channel: '#risk-signals', from: 'Szabo', text: "I can cover Hal's bid levels if needed. My inventory is light on BTC.", timestamp: '13:06:31', type: 'agent' },
  { channel: '#general', from: 'Satoshi', text: 'Price stabilized around 64,300. Proposing we tighten back to normal levels.', timestamp: '13:07:00', type: 'agent' },
];

export const negotiations: Negotiation[] = [
  { id: '1', description: 'Satoshi ↔ Vitalik: Ask allocation for BTC/USDT', status: 'AGREED' },
  { id: '2', description: 'Szabo: covering Hal\'s bids at 63900', status: 'PENDING' },
];

export const walletTxs: WalletTx[] = [
  { type: 'BUY', amount: 0.50, price: 64032, total: 32016, time: '13:04:22' },
  { type: 'SELL', amount: 0.20, price: 64015, total: 12803, time: '13:03:11' },
];

export { PRICE_CHANGE_24H };
