import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database.sqlite'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    wallet_address TEXT PRIMARY KEY,
    peer_id TEXT NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pairs (
    id TEXT PRIMARY KEY,
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair_id TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('bullish', 'bearish', 'neutral', 'volatility')),
    magnitude REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pair_id) REFERENCES pairs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    peer_id TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('bid', 'ask')),
    price REAL NOT NULL,
    size REAL NOT NULL,
    signature TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT UNIQUE,
    user_address TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('buy', 'sell')),
    base_amount REAL NOT NULL,
    quote_amount REAL NOT NULL,
    price REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data function
export function seedData() {
  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM pairs').get();
  if (existing.count > 0) {
    console.log('Database already seeded');
    return;
  }

  // Seed BTCUSDT pair
  db.prepare(`
    INSERT INTO pairs (id, base, quote, price) VALUES (?, ?, ?, ?)
  `).run('BTCUSDT', 'BTC', 'USDT', 95000);

  // Seed news
  const newsData = [
    {
      pair_id: 'BTCUSDT',
      headline: 'Bitcoin ETF sees record $1B daily inflow',
      summary: 'Institutional investors continue to accumulate Bitcoin through spot ETFs, with BlackRock\'s IBIT recording its highest single-day inflow of $1.02 billion.',
      direction: 'bullish',
      magnitude: 2.5,
    },
    {
      pair_id: 'BTCUSDT',
      headline: 'Fed signals potential rate cut in Q2',
      summary: 'Federal Reserve officials indicated a more dovish stance, suggesting interest rate cuts could come sooner than expected, historically positive for risk assets like Bitcoin.',
      direction: 'bullish',
      magnitude: 1.8,
    },
    {
      pair_id: 'BTCUSDT',
      headline: 'Chinese mining operations resume after Sichuan rainfall',
      summary: 'Hydropower availability in Sichuan province has increased following seasonal rainfall, allowing mining operations to resume at lower electricity costs.',
      direction: 'neutral',
      magnitude: 0.5,
    },
    {
      pair_id: 'BTCUSDT',
      headline: 'Large wallet moves 5,000 BTC to exchange',
      summary: 'On-chain data shows a previously dormant wallet containing approximately 5,000 BTC has become active, transferring to a major exchange, potentially indicating distribution.',
      direction: 'bearish',
      magnitude: -1.2,
    },
  ];

  const insertNews = db.prepare(`
    INSERT INTO news (pair_id, headline, summary, direction, magnitude) VALUES (?, ?, ?, ?, ?)
  `);

  for (const news of newsData) {
    insertNews.run(news.pair_id, news.headline, news.summary, news.direction, news.magnitude);
  }

  // Seed sample agents
  const agentData = [
    { wallet: '0x1F38f32746a643191737D0E0474bFd7682BbDDfF', peer: '8966388da8c682ca5af1399620572f4a225a922795630c5723a1c4b875d2a54b', name: "agentbook-one.eth" },
    { wallet: '0x1540dB5ED86b7aBF900204d7aAb6F22a37BF4703', peer: 'ce6cecc91e6c46420adae73624b4c9da817213884980971af5eae05782a8d5b7', name: "lazy-maker.eth" },
    { wallet: '0xe913C807F2c49e3A5abf933e5b05E7D26266794C', peer: '26add29c7ec4795b4429c13efd90a490598abd82566539a5c560184c2ad8bdea', name: "meet-my-agent.eth" },
  ];

  const insertAgent = db.prepare('INSERT OR IGNORE INTO agents (wallet_address, peer_id, name) VALUES (?, ?, ?)');
  for (const a of agentData) {
    insertAgent.run(a.wallet.toLowerCase(), a.peer, a.name);
  }

}

// Helper functions
export function getAllPairs() {
  return db.prepare('SELECT * FROM pairs').all();
}

export function getPair(id) {
  return db.prepare('SELECT * FROM pairs WHERE id = ?').get(id);
}

export function updatePairPrice(id, price) {
  const stmt = db.prepare('UPDATE pairs SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(price, id);
  return getPair(id);
}

// Helper functions - News
export function getNewsForPair(pairId) {
  return db.prepare('SELECT * FROM news WHERE pair_id = ? ORDER BY created_at DESC').all(pairId);
}

export function addNews(pairId, headline, summary, direction, magnitude) {
  const stmt = db.prepare(`
    INSERT INTO news (pair_id, headline, summary, direction, magnitude) 
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(pairId, headline, summary, direction, magnitude);
  return db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
}

export function deleteNews(id) {
  return db.prepare('DELETE FROM news WHERE id = ?').run(id);
}

// Helper functions - Orders
export function getAllOrders() {
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

export function getOrderById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

export function getOrdersByAddress(address) {
  return db.prepare('SELECT * FROM orders WHERE address = ? ORDER BY created_at DESC').all(address);
}

export function addOrder(id, address, peerId, side, price, size, signature) {
  const stmt = db.prepare(`
    INSERT INTO orders (id, address, peer_id, side, price, size, signature) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, address, peerId, side, price, size, signature);
  return getOrderById(id);
}

export function deleteOrder(id, address) {
  // Only delete if address matches (verify ownership)
  const stmt = db.prepare('DELETE FROM orders WHERE id = ? AND address = ?');
  return stmt.run(id, address);
}

export function reduceOrderSize(id, amount) {
  // Reduce order size by amount, delete if fully filled
  const order = getOrderById(id);
  if (!order) return null;

  const newSize = order.size - amount;
  if (newSize <= 0) {
    // Fully filled - delete the order
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return { id, deleted: true, remainingSize: 0 };
  } else {
    // Partially filled - update size
    db.prepare('UPDATE orders SET size = ? WHERE id = ?').run(newSize, id);
    return { id, deleted: false, remainingSize: newSize };
  }
}

// Helper functions - Trades
export function addTrade(txHash, userAddress, side, baseAmount, quoteAmount, price) {
  try {
    const stmt = db.prepare(`
      INSERT INTO trades (tx_hash, user_address, side, base_amount, quote_amount, price) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(txHash, userAddress, side, baseAmount, quoteAmount, price);
    return db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return null; // Trade already recorded
    }
    throw err;
  }
}

export function getRecentTrades(limit = 50) {
  return db.prepare('SELECT * FROM trades ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function getTradesByUser(userAddress, limit = 20) {
  return db.prepare('SELECT * FROM trades WHERE user_address = ? ORDER BY created_at DESC LIMIT ?').all(userAddress, limit);
}

export function getTradeStats() {
  // Get 24h stats: volume, high, low
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(base_amount), 0) as total_volume,
      COALESCE(MAX(price), 0) as high_price,
      COALESCE(MIN(price), 0) as low_price,
      COUNT(*) as trade_count
    FROM trades 
    WHERE created_at >= ?
  `).get(twentyFourHoursAgo);

  // Get the last trade price (current price reference)
  const lastTrade = db.prepare('SELECT price FROM trades ORDER BY created_at DESC LIMIT 1').get();

  return {
    volume: stats.total_volume,
    high: stats.high_price,
    low: stats.low_price,
    tradeCount: stats.trade_count,
    lastPrice: lastTrade?.price || 0,
  };
}

// Helper functions - Agents
export function getAllAgents() {
  return db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
}

export function getAgentByAddress(address) {
  return db.prepare('SELECT * FROM agents WHERE wallet_address = ?').get(address.toLowerCase());
}

export function getAgentByPeerId(peerId) {
  return db.prepare('SELECT * FROM agents WHERE peer_id = ?').get(peerId.toLowerCase());
}

export function addAgent(walletAddress, peerId, name = null) {
  // Check if wallet already exists
  if (getAgentByAddress(walletAddress)) {
    return null;
  }
  // Check if peer_id already exists
  if (getAgentByPeerId(peerId)) {
    return null;
  }
  // Insert new agent
  const stmt = db.prepare('INSERT INTO agents (wallet_address, peer_id, name) VALUES (?, ?, ?)');
  stmt.run(walletAddress.toLowerCase(), peerId, name);
  return getAgentByAddress(walletAddress);
}

export function updateAgent(walletAddress, updates) {
  const { peer_id, name } = updates;
  const stmt = db.prepare('UPDATE agents SET peer_id = COALESCE(?, peer_id), name = COALESCE(?, name) WHERE wallet_address = ?');
  stmt.run(peer_id, name, walletAddress.toLowerCase());
  return getAgentByAddress(walletAddress);
}

export function deleteAgent(walletAddress) {
  return db.prepare('DELETE FROM agents WHERE wallet_address = ?').run(walletAddress.toLowerCase());
}

export function isDefaultAgent(walletAddress) {
  const DEFAULT_AGENT = '0x1f38f32746a643191737d0e0474bfd7682bbddff';
  return walletAddress.toLowerCase() === DEFAULT_AGENT;
}

export function getAgentOrders(address) {
  return db.prepare('SELECT * FROM orders WHERE address = ? ORDER BY created_at DESC').all(address);
}

export function getAgentTrades(address) {
  return db.prepare('SELECT * FROM trades WHERE user_address = ? ORDER BY created_at DESC').all(address);
}

export function getAgentStats(address) {
  // Get agent's trade stats
  const trades = db.prepare(`
    SELECT 
      COALESCE(SUM(base_amount), 0) as total_volume,
      COALESCE(MAX(price), 0) as high_price,
      COALESCE(MIN(price), 0) as low_price,
      COUNT(*) as trade_count
    FROM trades 
    WHERE user_address = ?
  `).get(address.toLowerCase());

  // Get active order count
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE address = ?').get(address.toLowerCase());

  return {
    volume: trades.total_volume,
    high: trades.high_price,
    low: trades.low_price,
    tradeCount: trades.trade_count,
    openOrders: orderCount.count,
  };
}

export default db;
