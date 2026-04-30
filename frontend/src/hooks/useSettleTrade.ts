import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, erc20Abi } from 'viem';
import { MARKET_API_URL } from '../config/marketApi';

// Token addresses (Sepolia)
const WBTC_ADDRESS = '0x2Ad531B1fE90beF60F8C20d85092119C84904a76' as const;
const USDT_ADDRESS = '0x709bc83E7c65Dc9D4B4B24DDfE24D117DEde9924' as const;

// Settlement contract (Sepolia)
const SETTLEMENT_ADDRESS = '0xe3CeB910F779dE87F4716f9290dC41FCdd85b45B' as const;

// Settlement ABI
const SETTLEMENT_ABI = [
  {
    inputs: [
      { name: 'params', type: 'tuple', components: [
        { name: 'user', type: 'address' },
        { name: 'baseToken', type: 'address' },
        { name: 'quoteToken', type: 'address' },
        { name: 'isBuy', type: 'bool' },
        { name: 'minBaseAmount', type: 'uint256' },
        { name: 'maxBaseAmount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'userSignature', type: 'bytes' },
        { name: 'fills', type: 'tuple[]', components: [
          { name: 'agent', type: 'address' },
          { name: 'baseAmount', type: 'uint256' },
          { name: 'quoteAmount', type: 'uint256' }
        ]}
      ]}
    ],
    name: 'settleTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export interface Fill {
  agent: string;
  baseAmount: number;
  quoteAmount: number;
}

export interface SettleParams {
  side: 'buy' | 'sell';
  size: number;
  price: number;
}

// Token address constants as Address type
const WBTC_ADDR = WBTC_ADDRESS as `0x${string}`;
const USDT_ADDR = USDT_ADDRESS as `0x${string}`;
const SETTLEMENT_ADDR = SETTLEMENT_ADDRESS as `0x${string}`;

export function useSettleTrade() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check if user has approved Settlement contract for a token
  const checkSettlementAllowance = useCallback(async (tokenAddress: `0x${string}`, requiredAmount: bigint): Promise<boolean> => {
    if (!publicClient || !address) return false;
    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, SETTLEMENT_ADDR],
      }) as bigint;
      return allowance >= requiredAmount;
    } catch {
      return false;
    }
  }, [publicClient, address]);

  // Approve Settlement contract for a token
  const approveSettlement = useCallback(async (tokenAddress: `0x${string}`, amount: bigint): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!isConnected || !address || !walletClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    setApprovalLoading(true);
    try {
      const txHash = await walletClient.writeContract({
        account: address,
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SETTLEMENT_ADDR, amount],
      });

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      setNeedsApproval(false);
      return { success: true, txHash };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setApprovalLoading(false);
    }
  }, [isConnected, address, walletClient, publicClient]);

  const settleTrade = useCallback(async (params: SettleParams, autoApprove = true): Promise<{ success: boolean; txHash?: string; error?: string; needsApproval?: boolean }> => {
    if (!isConnected || !address || !walletClient) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!publicClient) {
      return { success: false, error: 'Public client not available' };
    }

    setLoading(true);
    setError(null);
    setNeedsApproval(false);

    try {
      // Step 1: Call backend to get fills
      const settleResponse = await fetch(`${MARKET_API_URL}/api/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: address,
          side: params.side,
          price: params.price,
          size: params.size,
        }),
      });

      if (!settleResponse.ok) {
        const errorData = await settleResponse.json();
        throw new Error(errorData.error || 'Failed to get fills from backend');
      }

      const settleData = await settleResponse.json();
      const { fills, deadline, isBuy } = settleData;

      // Step 2: Calculate total amounts for user tokens
      const totalUserAmount = fills.reduce((sum: number, f: Fill) => 
        isBuy ? sum + f.quoteAmount : sum + f.baseAmount, 0
      );

      // Step 3: Check and approve only for the token we're trading
      const userTokenAddr = isBuy ? USDT_ADDR : WBTC_ADDR;
      const userTokenSymbol = isBuy ? 'USDT' : 'WBTC';
      const requiredAllowance = parseUnits((totalUserAmount).toString(), 6);
      const hasUserAllowance = await checkSettlementAllowance(userTokenAddr, requiredAllowance);
      
      if (!hasUserAllowance) {
        console.log(`[SettleTrade] Approving ${userTokenSymbol} for Settlement...`);
        if (autoApprove) {
          const approveAmount = parseUnits((totalUserAmount).toString(), 6);
          const approveResult = await approveSettlement(userTokenAddr, approveAmount);
          if (!approveResult.success) {
            throw new Error(`Failed to approve ${userTokenSymbol}: ${approveResult.error}`);
          }
          console.log(`[SettleTrade] ${userTokenSymbol} approved successfully`);
        } else {
          setNeedsApproval(true);
          setLoading(false);
          return { success: false, error: `Please approve ${userTokenSymbol} for Settlement first`, needsApproval: true };
        }
      } else {
        console.log(`[SettleTrade] ${userTokenSymbol} already approved, skipping`);
      }

      // Step 4: Call Settlement contract (no signature needed with ERC20 approval)
      const fillStructs = fills.map((f: Fill) => ({
        agent: f.agent as `0x${string}`,
        baseAmount: parseUnits(f.baseAmount.toString(), 6),
        quoteAmount: parseUnits(f.quoteAmount.toString(), 6),
      }));

      const txHash = await walletClient.writeContract({
        account: address,
        address: SETTLEMENT_ADDR,
        abi: SETTLEMENT_ABI,
        functionName: 'settleTrade',
        args: [{
          user: address,
          baseToken: WBTC_ADDR,
          quoteToken: USDT_ADDR,
          isBuy,
          minBaseAmount: parseUnits((params.size * 0.99).toString(), 6), // 1% slippage
          maxBaseAmount: parseUnits((params.size * 1.01).toString(), 6),
          deadline: BigInt(deadline),
          userNonce: 0n, // Not used anymore
          userSignature: '0x' as `0x${string}`, // Not used anymore
          fills: fillStructs,
        }],
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Reduce order sizes in backend after successful settlement
      // The settleData now includes order_id for each fill
      try {
        const reduceFills = fills.map((f: any) => ({
          order_id: f.order_id,
          fill_amount: f.fill_amount || f.baseAmount,
        }));

        console.log('[SettleTrade] Reducing orders:', reduceFills);

        await fetch(`${MARKET_API_URL}/api/orders/reduce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fills: reduceFills }),
        });

        console.log('[SettleTrade] Order reduction completed');
      } catch (reduceErr) {
        console.warn('[SettleTrade] Failed to reduce order sizes:', reduceErr);
        // Don't fail the trade if reduce fails - trade already succeeded
      }

      setLoading(false);
      return { success: true, txHash };

    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [isConnected, address, walletClient, publicClient, checkSettlementAllowance, approveSettlement]);

  return {
    settleTrade,
    approveSettlement,
    checkSettlementAllowance,
    loading,
    approvalLoading,
    error,
    needsApproval,
  };
}