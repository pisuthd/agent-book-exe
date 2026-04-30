import { GetTokenBalancesTool } from "./tokens/get_balances_tool";
import { MintTokensTool } from "./tokens/mint_tokens_tool";
import { GetMarketDataTool } from "./market/get_market_data_tool";
import { GetOrdersTool } from "./orders/get_orders_tool";
import { SubmitOrderTool } from "./orders/submit_order_tool";
import { CancelOrderTool } from "./orders/cancel_order_tool";
import { ApprovePermit2Tool } from "./permit/approve_permit2_tool";
import { GetPermit2NonceTool } from "./permit/get_permit2_nonce_tool";
import { GetInventoryTool } from "./permit/get_inventory_tool";

export const AGENT_BOOK_TOOLS: any = [
    // Token tools
    GetTokenBalancesTool,
    MintTokensTool,
    // Market data
    GetMarketDataTool,
    // Order management
    GetOrdersTool,
    SubmitOrderTool,
    CancelOrderTool,
    // Permit2 & Trading
    ApprovePermit2Tool,
    GetPermit2NonceTool,
    GetInventoryTool
];
