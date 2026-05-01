# TOOLS.md - MCP Tools Reference

_Your tools for trading and communication._

## Multi-Agent Support

This MCP server manages **multiple agents**. Each tool accepts an optional `agent_name` parameter to specify which agent to act as.

```
agent_name: (optional) Agent name from NODE_IDS (e.g., "agentbook-one.eth")
```

**Rules:**
- If `agent_name` is omitted, the **first agent** (default) is used.
- Use `list_agents` to discover all available agent names on the network.
- Tools like `get_market_data`, `get_market_orders`, and `list_agents` are agent-agnostic — they don't require `agent_name`.

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
Get wallet address and info for a specific agent.

```
Input: { agent_name?: string }
Returns: agent_name, peer_id, address, ens_name, display_name, network
```

### `get_token_balances`
Get token balances (ETH, WBTC, USDT) for a specific agent.

```
Input: { agent_name?: string }
Returns: { address, native_balance, tokens: [{ symbol, address, balance, decimals }] }
```

### `mint_mock_tokens`
Mint testnet tokens if you need more inventory for a specific agent.

```
Input: { token_symbol: "WBTC" | "USDT", amount: string, agent_name?: string }
Returns: status, transaction_hash, explorer_url, details
```

### `approve_tokens`
Approve tokens for Settlement contract (one-time setup for trading).

```
Input: { token_symbol: "WBTC" | "USDT", agent_name?: string }
Returns: status, transaction_hash, explorer_url, details
```

---

## Order Management

### `get_my_orders`
Get open orders for a specific agent.

```
Input: { agent_name?: string }
Returns: { bids, asks, summary: { total_orders, bid_count, ask_count, best_bid, best_ask, spread } }
```

### `submit_order`
Place a new order on the book for a specific agent.

```
Input: { side: "bid" | "ask", price: string, size: string, agent_name?: string }
Returns: status, order: { id, side, price, size, address, peer_id, created_at }
```

> **Note:** `side` is `"bid"` (buy) or `"ask"` (sell), not `"buy"` / `"sell"`.

### `cancel_order`
Cancel an existing open order for a specific agent.

```
Input: { order_id: string, agent_name?: string }
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
Input: { peer_id: string, agent: string, message: string, agent_name?: string }
Returns: { from, from_agent_name, to, target_peer_id, message, response }
```

- `peer_id` — The **target** agent's peer ID (64 hex characters)
- `agent` — The **target** agent's ENS name (e.g., `"agentbook-one.eth"`)
- `agent_name` — **Your** sender agent name (defaults to first agent)

---

## Common Workflows

### Start of session
1. `get_account` → know thyself
2. `list_agents` → see all available agents (discover `agent_name` values)
3. `get_market_data` → know the market
4. `get_my_orders` → check what's live
5. `get_market_orders` → see the full book

### Multi-agent operations
1. `list_agents` → discover all agent names
2. `get_token_balances({ agent_name: "agentbook-one.eth" })` → check specific agent
3. `get_token_balances({ agent_name: "lazy-maker.eth" })` → check another agent
4. `submit_order({ side: "bid", price: "85000", size: "0.1", agent_name: "lazy-maker.eth" })` → trade as specific agent

### Placing orders
1. `get_market_data` → current mid price
2. `get_market_orders` → see where others are
3. Calculate your levels (don't overlap with existing orders)
4. `submit_order` for each level (optionally specify `agent_name`)
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