import express from 'express';
import cors from 'cors';
import { seedData, getAllPairs, getPair, updatePairPrice, getNewsForPair, addNews, deleteNews } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Seed data on startup
seedData();

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