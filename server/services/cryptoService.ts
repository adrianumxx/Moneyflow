import { ethers } from 'ethers';

// Fallback public RPCs if no API keys are provided
const DEFAULT_RPCS = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon.llamarpc.com',
  arbitrum: 'https://arbitrum.llamarpc.com',
  optimism: 'https://optimism.llamarpc.com'
};

export interface CryptoBalance {
  address: string;
  chain: string;
  nativeBalance: number;
  symbol: string;
  error?: string;
}

/**
 * Fetches the native balance (e.g., ETH, MATIC) for a given public address on a specific chain.
 * Uses ethers.js and public RPC nodes for zero-cost, read-only data fetching.
 */
export async function fetchNativeBalance(address: string, chain: keyof typeof DEFAULT_RPCS = 'ethereum'): Promise<CryptoBalance> {
  try {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address format.');
    }

    const rpcUrl = process.env[`RPC_URL_${chain.toUpperCase()}`] || DEFAULT_RPCS[chain];
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Fetch balance in Wei (smallest unit)
    const balanceWei = await provider.getBalance(address);
    
    // Convert to standard format (e.g., Ether)
    const balanceFormatted = parseFloat(ethers.formatEther(balanceWei));

    const symbols: Record<string, string> = {
      ethereum: 'ETH',
      polygon: 'MATIC',
      arbitrum: 'ETH',
      optimism: 'ETH'
    };

    return {
      address,
      chain,
      nativeBalance: balanceFormatted,
      symbol: symbols[chain] || 'UNKNOWN'
    };

  } catch (error: any) {
    console.error(`[CryptoService] Failed to fetch balance for ${address} on ${chain}:`, error);
    return {
      address,
      chain,
      nativeBalance: 0,
      symbol: 'UNKNOWN',
      error: error.message
    };
  }
}
