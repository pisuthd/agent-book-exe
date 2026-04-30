import express from 'express';
import cors from 'cors';
import { seedData, getAllPairs, getPair, updatePairPrice, getNewsForPair, addNews, deleteNews, getAllPeersFromDb, addPeer, deletePeer } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Seed data on startup
seedData();

// Hardcoded default peers
const DEFAULT_PEERS = [
  '8966388da8c682ca5af1399620572f4a225a922795630c5723a1c4b875d2a54b',
  '34ddb6c97d8ba0c849d332b220ba23018f67836fee160aa0cfeeb3c664722e92',
];

// ============ PEERS ============

// GET all peers (hardcoded + user-added)
app.get('/api/peers', (req, res) => {
  try {
    const dbPeers = getAllPeersFromDb();
    
    // Combine hardcoded + user-added, mark source
    const peers = [
      ...DEFAULT_PEERS.map((pk, idx) => ({
        id: `default-${idx}`,
        public_key: pk,
        source: 'default',
      })),
      ...dbPeers.map(p => ({
        id: p.id.toString(),
        public_key: p.public_key,
        source: 'user',
      })),
    ];
    
    res.json(peers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add peer
app.post('/api/peers', (req, res) => {
  try {
    const { public_key } = req.body;
    
    if (!public_key || public_key.length !== 64 || !/^[a-fA-F0-9]+$/.test(public_key)) {
      return res.status(400).json({ error: 'Invalid public key: must be 64 hex characters' });
    }
    
    // Check if already in defaults
    if (DEFAULT_PEERS.includes(public_key.toLowerCase())) {
      return res.status(400).json({ error: 'Peer already in default list' });
    }
    
    const peer = addPeer(public_key.toLowerCase());
    if (!peer) {
      return res.status(400).json({ error: 'Peer already exists' });
    }
    
    res.status(201).json({
      id: peer.id.toString(),
      public_key: peer.public_key,
      source: 'user',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE peer
app.delete('/api/peers/:id', (req, res) => {
  try {
    // Can't delete default peers
    if (req.params.id.startsWith('default-')) {
      return res.status(400).json({ error: 'Cannot delete default peers' });
    }
    
    const result = deletePeer(parseInt(req.params.id));
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Peer not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PAIRS ============

// GET all pairs
app.get('/api/pairs', (req, res) => {
  try {
    const pairs = getAllPairs();
    res.json(pairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single pair with news
app.get('/api/pairs/:id', (req, res) => {
  try {
    const pair = getPair(req.params.id);
    if (!pair) {
      return res.status(404).json({ error: 'Pair not found' });
    }
    const news = getNewsForPair(req.params.id);
    res.json({ ...pair, news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update pair price
app.put('/api/pairs/:id/price', (req, res) => {
  try {
    const { price } = req.body;
    if (typeof price !== 'number') {
      return res.status(400).json({ error: 'Price must be a number' });
    }
    const pair = updatePairPrice(req.params.id, price);
    if (!pair) {
      return res.status(404).json({ error: 'Pair not found' });
    }
    res.json(pair);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ NEWS ============

// GET news for a pair
app.get('/api/pairs/:id/news', (req, res) => {
  try {
    const news = getNewsForPair(req.params.id);
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add news to pair
app.post('/api/pairs/:id/news', (req, res) => {
  try {
    const { headline, summary, direction, magnitude } = req.body;
    
    if (!headline || !summary || !direction) {
      return res.status(400).json({ error: 'headline, summary, and direction are required' });
    }
    
    if (!['bullish', 'bearish', 'neutral', 'volatility'].includes(direction)) {
      return res.status(400).json({ error: 'direction must be bullish, bearish, neutral, or volatility' });
    }

    const news = addNews(req.params.id, headline, summary, direction, magnitude || 0);
    res.status(201).json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE news
app.delete('/api/news/:id', (req, res) => {
  try {
    const result = deleteNews(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AgentBook backend running on http://localhost:${PORT}`);
});