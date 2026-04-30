import { GetOrdersTool } from "./get_orders_tool";
import { SubmitOrderTool } from "./submit_order_tool";
import { CancelOrderTool } from "./cancel_order_tool";

export const orderTools = [
    GetOrdersTool,
    SubmitOrderTool,
    CancelOrderTool
];

export { GetOrdersTool, SubmitOrderTool, CancelOrderTool };
