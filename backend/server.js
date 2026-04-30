import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';
import { 
  seedData, getAllPairs, getPair, updatePairPrice, 
  getNewsForPair, addNews, deleteNews, 
  getAllPeersFromDb, addPeer, deletePeer,
  getAllOrders, getOrderById, getOrdersByAddress, addOrder, deleteOrder 
} from './db.js';

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

// ============ ORDERS ============

// Verify signed message and recover address
function verifySignature(message, signature, expectedAddress) {
  try {
    const msgHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    const msgHashBytes = ethers.getBytes(msgHash);
    const recoveredAddress = ethers.verifyMessage(ethers.toUtf8Bytes(message), signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (err) {
    return false;
  }
}

// GET all orders (market view)
app.get('/api/orders', (req, res) => {
  try {
    const orders = getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET orders by wallet address
app.get('/api/orders/:address', (req, res) => {
  try {
    const address = req.params.address;
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    const orders = getOrdersByAddress(address.toLowerCase());
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit order (requires signature)
app.post('/api/orders', (req, res) => {
  try {
    const { address, peer_id, side, price, size, signature, timestamp } = req.body;
    
    // Validate required fields
    if (!address || !peer_id || !side || price === undefined || !size || !signature || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields: address, peer_id, side, price, size, signature, timestamp' });
    }
    
    // Validate peer_id format (64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(peer_id)) {
      return res.status(400).json({ error: 'Invalid peer_id format: must be 64 hex characters' });
    }
    
    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    // Validate side
    if (!['bid', 'ask'].includes(side)) {
      return res.status(400).json({ error: 'Side must be bid or ask' });
    }
    
    // Validate price and size
    if (price <= 0 || size <= 0) {
      return res.status(400).json({ error: 'Price and size must be positive' });
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const now = Date.now();
    const orderTime = parseInt(timestamp);
    if (isNaN(orderTime) || Math.abs(now - orderTime) > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Timestamp expired or invalid' });
    }
    
    // Verify signature
    const message = JSON.stringify({ action: 'submit_order', side, price, size, timestamp, peer_id });
    if (!verifySignature(message, signature, address)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Create order
    const id = randomUUID();
    const order = addOrder(id, address.toLowerCase(), peer_id, side, price, size, signature);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE cancel order (requires signature)
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { address, signature, timestamp } = req.body;
    const orderId = req.params.id;
    
    if (!address || !signature || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields: address, signature, timestamp' });
    }
    
    // Check if order exists
    const order = getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify ownership (address must match)
    if (order.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }
    
    // Verify timestamp
    const now = Date.now();
    const cancelTime = parseInt(timestamp);
    if (isNaN(cancelTime) || Math.abs(now - cancelTime) > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Timestamp expired or invalid' });
    }
    
    // Verify signature
    const message = JSON.stringify({ action: 'cancel_order', order_id: orderId, timestamp });
    if (!verifySignature(message, signature, address)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Delete order
    const result = deleteOrder(orderId, address.toLowerCase());
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found or not authorized' });
    }
    
    res.json({ success: true, order_id: orderId });
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