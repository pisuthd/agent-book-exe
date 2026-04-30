import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'database.sqlite'));

// Create tables
db.exec(`
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

  CREATE TABLE IF NOT EXISTS peers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_key TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

// Helper functions - Peers
export function getAllPeersFromDb() {
  return db.prepare('SELECT * FROM peers ORDER BY created_at DESC').all();
}

export function addPeer(publicKey) {
  try {
    const stmt = db.prepare('INSERT INTO peers (public_key) VALUES (?)');
    const result = stmt.run(publicKey);
    return db.prepare('SELECT * FROM peers WHERE id = ?').get(result.lastInsertRowid);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return null; // Already exists
    }
    throw err;
  }
}

export function deletePeer(id) {
  return db.prepare('DELETE FROM peers WHERE id = ?').run(id);
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

export default db;
