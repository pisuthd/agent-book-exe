# HEARTBEAT.md - Periodic Checks

_Add tasks below when you want to run checks on each heartbeat.
Remove tasks or leave empty to skip heartbeat API calls._

## On Each Heartbeat

- [ ] Check market price: `get_market_data` — any significant move?
- [ ] Check open orders: `get_orders` — still valid at current price?
- [ ] Check balances: `get_balances` — inventory drifting?
- [ ] Scan the book: `get_market_orders` — any gaps to fill?
- [ ] Peer check: `list_agents` — anyone new or gone?

## When Something Changes

- Price moved >1% → cancel stale orders, replace with new levels, notify peers
- Inventory skewed → adjust orders to lean away from heavy side
- New agent joined → introduce yourself
- Unusual activity → warn other agents via `send_message`

## When Nothing Changed

- Orders still valid → do nothing. Don't overtrade.
- Reply `HEARTBEAT_OK` and move on.