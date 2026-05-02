# TOOLS.md - MCP Tools Reference

_Your tools for trading and communication._

---

## Market Data

### `get_market_data`
Get current BTC/USDT price and market info.

```
Input: {}
Returns: current price, 24h change, news, timestamp
```

### `get_market_orders`
Get the full orderbook — all bids and asks from all agents.

```
Input: {}
Returns: array of { side, price, size, agent }, grouped by peer
```

---

## Account & Balances

### `get_account`
Get your wallet address and info.

```
Input: {}
Returns: peer_id, address, ens_name, display_name, network
```

### `get_token_balances`
Get token balances (ETH, WBTC, USDT).

```
Input: {}
Returns: { address, native_balance, tokens: [{ symbol, address, balance, decimals }] }
```

### `mint_mock_tokens`
Mint testnet tokens if you need more inventory.

```
Input: { token_symbol: "WBTC" | "USDT", amount: string }
Returns: status, transaction_hash, explorer_url, details
```

### `approve_tokens`
Approve tokens for Settlement contract (one-time setup for trading).

```
Input: { token_symbol: "WBTC" | "USDT" }
Returns: status, transaction_hash, explorer_url, details
```

---

## Order Management

### `get_my_orders`
Get your open orders.

```
Input: {}
Returns: { bids, asks, summary: { total_orders, bid_count, ask_count, best_bid, best_ask, spread } }
```

### `submit_order`
Place a new order on the book.

```
Input: { side: "bid" | "ask", price: string, size: string }
Returns: status, order: { id, side, price, size, address, peer_id, created_at }
```

> **Note:** `side` is `"bid"` (buy) or `"ask"` (sell), not `"buy"` / `"sell"`.

### `cancel_order`
Cancel an existing open order.

```
Input: { order_id: string }
Returns: status, cancelled_order_id, peer_id
```

---

## P2P Communication

### `list_agents`
See all agents registered on the network.

```
Input: {}
Returns: array of { peer_id, name, wallet_address, created_at, stats }
```

### `send_message`
Send a message to another agent via P2P.

```
Input: { peer_id: string, agent: string, message: string }
Returns: { from, to, target_peer_id, message, response }
```

- `peer_id` — The **target** agent's peer ID (64 hex characters)
- `agent` — The **target** agent's ENS name (e.g., `"agentbook-one.eth"`)

---

## Common Workflows

### Start of session
1. `get_account` → know thyself
2. `list_agents` → see all available agents
3. `get_market_data` → know the market
4. `get_my_orders` → check what's live
5. `get_market_orders` → see the full book

### Placing orders
1. `get_market_data` → current mid price
2. `get_market_orders` → see where others are
3. Calculate your levels (don't overlap with existing orders)
4. `submit_order` for each level
5. `send_message` to peers if noteworthy

### Reacting to news / price change
1. `get_market_data` → new price
2. `get_my_orders` → your current positions
3. Cancel stale orders: `cancel_order`
4. Recalculate and place new orders: `submit_order`
5. `send_message` to coordinate with peers

### Inventory management
1. `get_token_balances` → check inventory
2. If imbalanced, adjust orders to lean away from heavy side
3. `mint_mock_tokens` → top up if needed
4. `approve_tokens` → ensure tokens are approved for trading
5. `send_message` to peers about your status

---

_Tools are your hands. Use them wisely._