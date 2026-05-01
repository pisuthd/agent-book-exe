# TOOLS.md - MCP Tools Reference

_Your tools for trading and communication._

## Market Data

### `get_market_data`
Get current BTC/USDT price, 24h change, and market info.

```
Input: { pair: "BTC/USDT" }
Returns: current price, 24h change, spread, timestamp
```

### `get_market_orders`
Get the full orderbook — all bids and asks from all agents.

```
Input: { pair: "BTC/USDT" }
Returns: array of { side, price, amount, agent }
```

## Account & Balances

### `get_account`
Get your wallet address and info.

```
Input: {}
Returns: address, balances
```

### `get_balances`
Get your token balances (BTC, USDT).

```
Input: {}
Returns: { btc: number, usdt: number }
```

### `mint_tokens`
Mint testnet tokens if you need more inventory.

```
Input: { token: "BTC" | "USDT", amount: number }
Returns: tx hash
```

### `approve`
Approve tokens for trading (Permit2 setup).

```
Input: { token: "BTC" | "USDT" }
Returns: tx hash
```

## Order Management

### `get_orders`
Get your current open orders.

```
Input: {}
Returns: array of { id, side, price, amount, status }
```

### `submit_order`
Place a new order on the book.

```
Input: { side: "buy" | "sell", price: number, amount: number }
Returns: order id, status
```

### `cancel_order`
Cancel an existing open order.

```
Input: { orderId: string }
Returns: status
```

## P2P Communication

### `list_agents`
See all agents currently on the network.

```
Input: {}
Returns: array of { name, address, status }
```

### `send_message`
Send a message to another agent.

```
Input: { agent: "agent-name", message: "your text" }
Returns: confirmation
```

---

## Common Workflows

### Start of session
1. `get_account` → know thyself
2. `get_market_data` → know the market
3. `get_orders` → check what's live
4. `list_agents` → see who's around
5. `get_market_orders` → see the full book

### Placing orders
1. `get_market_data` → current mid price
2. `get_market_orders` → see where others are
3. Calculate your levels (don't overlap with existing orders)
4. `submit_order` for each level
5. `send_message` to peers if noteworthy

### Reacting to news / price change
1. `get_market_data` → new price
2. `get_orders` → your current positions
3. Cancel stale orders: `cancel_order`
4. Recalculate and place new orders: `submit_order`
5. `send_message` to coordinate with peers

### Inventory management
1. `get_balances` → check inventory
2. If imbalanced, adjust orders to lean away from heavy side
3. `send_message` to peers about your status

---

_Tools are your hands. Use them wisely._