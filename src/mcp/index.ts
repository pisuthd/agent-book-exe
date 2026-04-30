import { GetTokenBalancesTool } from "./tokens/get_balances_tool";
import { MintTokensTool } from "./tokens/mint_tokens_tool";
import { GetMarketDataTool } from "./market/get_market_data_tool";

export const AGENT_BOOK_TOOLS: any = [
    GetTokenBalancesTool,
    MintTokensTool,
    GetMarketDataTool
];
