import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { BACKEND_URL } from "../../config";

const DEFAULT_PAIR = 'BTCUSDT';

interface MarketData {
    id: string;
    base: string;
    quote: string;
    price: number;
    updated_at: string;
    news?: Array<{
        id: number;
        pair_id: string;
        headline: string;
        summary: string;
        direction: 'bullish' | 'bearish' | 'neutral' | 'volatility';
        magnitude: number;
        created_at: string;
    }>;
}

export const GetMarketDataTool: McpTool = {
    name: "get_market_data",
    description: "Get current market price and news for the BTCUSDT trading pair",
    schema: {
        // No input parameters - always uses default pair
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/pairs/${DEFAULT_PAIR}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json() as MarketData;

            return {
                status: "success",
                pair: data.id,
                base: data.base,
                quote: data.quote,
                price: data.price,
                updated_at: data.updated_at,
                news: data.news || [],
                summary: `Current ${data.base}/${data.quote} price: $${data.price}\n` +
                    `${data.news?.length || 0} news items available`
            };
        } catch (error: any) {
            throw new Error(`Failed to get market data: ${error.message}`);
        }
    }
};
