import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';
import { 
  seedData, getAllPairs, getPair, updatePairPrice, 
  getNewsForPair, addNews, deleteNews, 
  getAllOrders, getOrderById, getOrdersByAddress, addOrder, deleteOrder, reduceOrderSize,
  addTrade, getRecentTrades, getTradesByUser, getTradeStats,
  getAllAgents, getAgentByAddress, getAgentByPeerId, addAgent, deleteAgent, isDefaultAgent, getAgentOrders, getAgentTrades, getAgentStats
} from './db.js';

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

// ============ SETTLE ============

// POST settle trade
app.post('/api/settle', (req, res) => {
  try {
    const { user_address, side, price, size } = req.body;
    
    if (!user_address || !side || price === undefined || !size) {
      return res.status(400).json({ error: 'Missing required fields: user_address, side, price, size' });
    }
    
    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(user_address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    // Validate side
    if (!['buy', 'sell'].includes(side.toLowerCase())) {
      return res.status(400).json({ error: 'Side must be buy or sell' });
    }
    
    if (price <= 0 || size <= 0) {
      return res.status(400).json({ error: 'Price and size must be positive' });
    }
    
    const isBuy = side.toLowerCase() === 'buy';
    
    // Get all orders and match
    const allOrders = getAllOrders();
    
    // Filter matching orders
    const matchingOrders = allOrders.filter(order => {
      if (isBuy) {
        // User wants to BUY (bid) - match against ASKs
        return order.side === 'ask' && parseFloat(order.price) <= price;
      } else {
        // User wants to SELL (ask) - match against BIDs
        return order.side === 'bid' && parseFloat(order.price) >= price;
      }
    }).sort((a, b) => {
      // Sort by price (best first)
      if (isBuy) {
        return parseFloat(a.price) - parseFloat(b.price); // lowest asks first
      } else {
        return parseFloat(b.price) - parseFloat(a.price); // highest bids first
      }
    });
    
    if (matchingOrders.length === 0) {
      return res.status(404).json({ error: 'No matching orders found' });
    }
    
    // Calculate fills (aggressive partial fill)
    let remainingSize = size;
    const fills = [];
    
    for (const order of matchingOrders) {
      if (remainingSize <= 0) break;
      
      const orderSize = parseFloat(order.size);
      const orderPrice = parseFloat(order.price);
      const fillSize = Math.min(remainingSize, orderSize);
      
      fills.push({
        order_id: order.id, // Include order ID for reducing later!
        agent: order.address,
        baseAmount: fillSize, // BTC amount
        quoteAmount: fillSize * orderPrice, // USDT amount
        fill_amount: fillSize, // Same as baseAmount for BTC
      });
      
      remainingSize -= fillSize;
    }
    
    if (fills.length === 0) {
      return res.status(404).json({ error: 'Could not create fills' });
    }
    
    const totalBase = fills.reduce((sum, f) => sum + f.baseAmount, 0);
    const totalQuote = fills.reduce((sum, f) => sum + f.quoteAmount, 0);
    
    // Deadline: 5 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 5 * 60;
    
    res.json({
      success: true,
      isBuy,
      user_address: user_address.toLowerCase(),
      fills,
      total_base: totalBase,
      total_quote: totalQuote,
      filled_size: totalBase,
      remaining_size: remainingSize > 0 ? remainingSize : 0,
      deadline,
      // Token addresses (Sepolia)
      baseToken: '0x2Ad531B1fE90beF60F8C20d85092119C84904a76', // WBTC
      quoteToken: '0x709bc83E7c65Dc9D4B4B24DDfE24D117DEde9924', // USDT 
      settlementContract: '0xe3CeB910F779dE87F4716f9290dC41FCdd85b45B',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reduce order size (call after successful settlement)
app.post('/api/orders/reduce', (req, res) => {
  try {
    const { fills } = req.body;
    
    if (!fills || !Array.isArray(fills)) {
      return res.status(400).json({ error: 'Missing required field: fills (array of {order_id, fill_amount})' });
    }
    
    const results = [];
    
    for (const fill of fills) {
      const { order_id, fill_amount } = fill;
      
      if (!order_id || !fill_amount) {
        results.push({ order_id, error: 'Missing order_id or fill_amount' });
        continue;
      }
      
      const order = getOrderById(order_id);
      if (!order) {
        results.push({ order_id, error: 'Order not found' });
        continue;
      }
      
      const result = reduceOrderSize(order_id, fill_amount);
      
      if (result) {
        results.push({
          order_id,
          deleted: result.deleted,
          remaining_size: result.remainingSize,
        });
      } else {
        results.push({ order_id, error: 'Failed to reduce order' });
      }
    }
    
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TRADES ============

// GET recent trades
app.get('/api/trades', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const trades = getRecentTrades(limit);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trade stats (24h volume, high, low)
app.get('/api/trades/stats', (req, res) => {
  try {
    const stats = getTradeStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trades by user address
app.get('/api/trades/:address', (req, res) => {
  try {
    const address = req.params.address;
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    const limit = parseInt(req.query.limit) || 20;
    const trades = getTradesByUser(address.toLowerCase(), limit);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record a trade (called after settlement)
app.post('/api/trades/record', (req, res) => {
  try {
    const { tx_hash, user_address, side, base_amount, quote_amount, price } = req.body;
    
    if (!tx_hash || !user_address || !side || base_amount === undefined || !quote_amount || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({ error: 'Side must be buy or sell' });
    }
    
    const trade = addTrade(tx_hash, user_address.toLowerCase(), side, base_amount, quote_amount, price);
    
    if (!trade) {
      return res.status(409).json({ error: 'Trade already recorded' });
    }
    
    res.status(201).json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AGENTS ============

// GET all agents
app.get('/api/agents', (req, res) => {
  try {
    const agents = getAllAgents();
    // Enrich with stats
    const enrichedAgents = agents.map(agent => {
      const stats = getAgentStats(agent.wallet_address);
      return { ...agent, stats };
    });
    res.json(enrichedAgents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single agent by address with details
app.get('/api/agents/:address', (req, res) => {
  try {
    const address = req.params.address;
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const agent = getAgentByAddress(address.toLowerCase());
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Get related data
    const orders = getAgentOrders(address.toLowerCase());
    const trades = getAgentTrades(address.toLowerCase());
    const stats = getAgentStats(address.toLowerCase());
    
    res.json({
      ...agent,
      orders,
      trades: trades.slice(0, 10), // Last 10 trades
      stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new agent
app.post('/api/agents', (req, res) => {
  try {
    const { wallet_address, peer_id, name } = req.body;
    
    if (!wallet_address || !peer_id) {
      return res.status(400).json({ error: 'wallet_address and peer_id are required' });
    }
    
    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Validate peer_id (64 hex chars)
    if (!/^[a-fA-F0-9]{64}$/.test(peer_id)) {
      return res.status(400).json({ error: 'Invalid peer_id format: must be 64 hex characters' });
    }
    
    // Check existing agents for debugging
    const existingByWallet = getAgentByAddress(wallet_address.toLowerCase());
    const existingByPeer = getAgentByPeerId(peer_id);
    
    const agent = addAgent(wallet_address, peer_id, name || null);
    
    if (!agent) {
      return res.status(409).json({ 
        error: 'Agent already exists',
        debug: {
          wallet_exists: !!existingByWallet,
          peer_exists: !!existingByPeer
        }
      });
    }
    
    res.status(201).json(agent);
  } catch (err) {
    console.error('Add agent error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove agent
app.delete('/api/agents/:address', (req, res) => {
  try {
    const address = req.params.address;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    // Check if it's the default agent
    if (isDefaultAgent(address)) {
      return res.status(403).json({ error: 'Cannot remove the default agent' });
    }
    
    const result = deleteAgent(address);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agent not found' });
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
