import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';
import { useEffect, useState } from 'react';

// Token config
export const TOKENS = {
  ETH: { 
    symbol: 'ETH', 
    name: 'Ethereum',
    address: null as `0x${string}` | null,
    icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
    decimals: 18,
    mintAmount: '0',
  },
  BTC: { 
    symbol: 'BTC', 
    name: 'Wrapped Bitcoin',
    address: '0x2Ad531B1fE90beF60F8C20d85092119C84904a76' as `0x${string}`,
    icon: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400',
    decimals: 6,
    mintAmount: '0.1',
  },
  USDT: { 
    symbol: 'USDT', 
    name: 'Tether',
    address: '0x709bc83E7c65Dc9D4B4B24DDfE24D117DEde9924' as `0x${string}`,
    icon: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661',
    decimals: 6,
    mintAmount: '1000',
  },
};

export const PRICES: Record<string, number> = { ETH: 2500, BTC: 95000, USDT: 1 };

export interface TokenBalance {
  symbol: string;
  name: string;
  address: `0x${string}` | null;
  icon: string;
  decimals: number;
  mintAmount: string;
  amount: number;
  usdValue: number;
}

export function useTokenBalances() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const { data: btcBalance, refetch: refetchBtc } = useReadContract({
    address: TOKENS.BTC.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: usdtBalance, refetch: refetchUsdt } = useReadContract({
    address: TOKENS.USDT.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Track mint state
  const [mintToken, setMintToken] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const mint = (token: typeof TOKENS.BTC | typeof TOKENS.USDT) => {
    if (!address) return;
    setIsMinting(true);
    setMintToken(token.symbol);
    writeContract({
      address: token.address,
      abi: [
        {
          name: 'mint',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'mint',
      args: [address, parseUnits(token.mintAmount, token.decimals)],
    });
  };

  // Refetch when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && mintToken) {
      setTimeout(() => {
        refetchBtc();
        refetchUsdt();
        setIsMinting(false);
        setMintToken(null);
      }, 1000);
    }
  }, [isConfirmed, mintToken, refetchBtc, refetchUsdt]);

  // Format balance from bigint
  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return 0;
    return Number(balance) / Math.pow(10, decimals);
  };

  const ethAmount = ethBalance ? Number(ethBalance.value.toString()) / 1e18 : 0;
  const btcAmount = formatBalance(btcBalance, TOKENS.BTC.decimals);
  const usdtAmount = formatBalance(usdtBalance, TOKENS.USDT.decimals);

  const balances: TokenBalance[] = [
    { ...TOKENS.ETH, amount: ethAmount, usdValue: ethAmount * PRICES.ETH },
    { ...TOKENS.BTC, amount: btcAmount, usdValue: btcAmount * PRICES.BTC },
    { ...TOKENS.USDT, amount: usdtAmount, usdValue: usdtAmount * PRICES.USDT },
  ];

  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);

  return {
    address,
    isConnected,
    balances,
    totalUSD,
    mint,
    refetchAll: () => { refetchBtc(); refetchUsdt(); },
    isMinting,
  };
}