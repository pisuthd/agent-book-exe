import { GetTokenBalancesTool } from "./tokens/get_balances_tool";
import { MintTokensTool } from "./tokens/mint_tokens_tool";
import { GetMarketDataTool } from "./market/get_market_data_tool";
import { GetOrdersTool } from "./orders/get_orders_tool";
import { SubmitOrderTool } from "./orders/submit_order_tool";
import { CancelOrderTool } from "./orders/cancel_order_tool";
import { ApproveTool } from "./permit/approve_tool";
import { GetAccountTool } from "./account/get_account_tool";

export const AGENT_BOOK_TOOLS: any = [
    // Account
    GetAccountTool,
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
    ApproveTool
];
