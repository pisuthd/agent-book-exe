import { GetTokenBalancesTool } from "./get_balances_tool";
import { MintTokensTool } from "./mint_tokens_tool";
import { ApproveTool } from "./approve_tool";

export const tokenTools = [
    GetTokenBalancesTool,
    MintTokensTool,
    ApproveTool
];

export { GetTokenBalancesTool, MintTokensTool, ApproveTool };
