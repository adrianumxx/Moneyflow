import React, { useState } from 'react';
import { Wallet, Search, RefreshCw, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

interface CryptoConnectorProps {
  userId: string;
}

export default function CryptoConnector({ userId }: CryptoConnectorProps) {
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [walletData, setWalletData] = useState<{ balanceETH: number; balanceUSD: number; ethPrice: number } | null>(null);
  const { showNotification } = useNotifications();

  const handleScan = async () => {
    if (!address.startsWith('0x') || address.length !== 42) {
      showNotification('Invalid Address', 'Please enter a valid Ethereum wallet address (0x...)', 'error');
      return;
    }

    setIsScanning(true);
    try {
      // 1. Fetch ETH Balance using Cloudflare Public Node (No API Key required)
      const rpcResponse = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 1
        })
      });
      const rpcData = await rpcResponse.json();
      
      if (rpcData.error) throw new Error(rpcData.error.message);
      
      const balanceWei = BigInt(rpcData.result);
      const balanceETH = Number(balanceWei) / 1e18;

      // 2. Fetch Live ETH Price using CoinGecko Public API
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const priceData = await priceResponse.json();
      const ethPrice = priceData.ethereum.usd;

      setWalletData({
        balanceETH,
        balanceUSD: balanceETH * ethPrice,
        ethPrice
      });

      // 3. Save to Firestore (Architecture Bridge)
      if (userId && !userId.startsWith('demo-')) {
        const walletRef = collection(db, 'users', userId, 'cryptoWallets');
        const q = query(walletRef, where('address', '==', address));
        const querySnapshot = await getDocs(q);

        const walletPayload = {
          ownerId: userId,
          address: address,
          chain: 'ethereum',
          label: 'Main Ethereum Wallet',
          nativeBalance: balanceETH,
          fiatValue: balanceETH * ethPrice,
          currency: 'USD',
          lastSyncedAt: serverTimestamp(),
          status: 'connected',
          updatedAt: serverTimestamp()
        };

        if (querySnapshot.empty) {
          await addDoc(walletRef, {
            ...walletPayload,
            createdAt: serverTimestamp()
          });
        } else {
          const docRef = doc(db, 'users', userId, 'cryptoWallets', querySnapshot.docs[0].id);
          await updateDoc(docRef, walletPayload);
        }

        // Also update/create a corresponding Asset record for WealthOverview
        const assetsRef = collection(db, 'users', userId, 'assets');
        const assetQ = query(assetsRef, where('institution', '==', 'Web3 Wallet'), where('notes', '==', address));
        const assetSnap = await getDocs(assetQ);

        const assetPayload = {
          ownerId: userId,
          name: `ETH Wallet (${address.slice(0, 6)}...)`,
          type: 'crypto',
          value: balanceETH * ethPrice,
          institution: 'Web3 Wallet',
          notes: address,
          updatedAt: serverTimestamp()
        };

        if (assetSnap.empty) {
          await addDoc(assetsRef, {
            ...assetPayload,
            createdAt: serverTimestamp()
          });
        } else {
          const assetDocRef = doc(db, 'users', userId, 'assets', assetSnap.docs[0].id);
          await updateDoc(assetDocRef, assetPayload);
        }
      }

      showNotification('Wallet Synced', 'Live balance retrieved and archived.', 'success');
      setAddress('');
    } catch (error) {
      console.error(error);
      showNotification('Sync Failed', 'Could not read from blockchain. Try again later.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
          <Wallet className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Native Web3 Sync</h2>
          <p className="text-sm text-slate-400">Track ERC-20 wallets in real-time via public nodes.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Paste your ETH address (0x...)" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-[#020617] border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm"
          />
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning || !address}
          className="px-8 py-4 bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isScanning ? <><RefreshCw className="w-5 h-5 animate-spin" /> Scanning...</> : 'Sync Wallet'}
        </button>
      </div>

      {walletData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#020617]/50 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Balance</h3>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              <Zap className="w-3 h-3" /> Real-time
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-6">
            <div>
              <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                ${walletData.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-indigo-400 font-mono mt-1">
                {walletData.balanceETH.toFixed(4)} ETH
              </p>
            </div>
            <div className="text-sm text-slate-500 pb-1">
              @ ${walletData.ethPrice.toLocaleString()} / ETH
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
             <button 
               onClick={() => setWalletData(null)}
               className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
             >
               Clear Result
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
