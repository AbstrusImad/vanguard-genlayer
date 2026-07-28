'use client';

import { useCallback, useState } from 'react';
import { createAccount } from 'genlayer-js';
import { makeLocalClient, makeWalletClient, SignerClient } from '@/lib/contract';

const KEY_STORAGE = 'vanguard.localkey';
const BRADBURY_PARAMS = {
  chainId: '0x107D',
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
    };
  }
}

const isKey = (k: string) => /^0x[0-9a-fA-F]{64}$/.test(k.trim());

function generateKey(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [localKey, setLocalKey] = useState<`0x${string}` | null>(null);
  const [mode, setMode] = useState<'wallet' | 'local' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setError('No injected wallet detected.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accs = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BRADBURY_PARAMS.chainId }] });
      } catch (switchErr: unknown) {
        if ((switchErr as { code?: number })?.code === 4902) {
          await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
        }
      }
      setAddress(accs[0] as `0x${string}`);
      setMode('wallet');
    } catch {
      setError('Could not connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectLocal = useCallback((importKey?: string) => {
    setError(null);
    const stored = window.localStorage.getItem(KEY_STORAGE);
    const key = importKey
      ? importKey.trim()
      : stored && isKey(stored)
        ? stored
        : generateKey();
    if (!isKey(key)) {
      setError('Invalid private key.');
      return;
    }
    window.localStorage.setItem(KEY_STORAGE, key);
    setLocalKey(key as `0x${string}`);
    setAddress(createAccount(key as `0x${string}`).address as `0x${string}`);
    setMode('local');
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setLocalKey(null);
    setMode(null);
  }, []);

  const getSignerClient = useCallback((): SignerClient | null => {
    if (mode === 'local' && localKey) return makeLocalClient(localKey);
    if (mode === 'wallet' && address) return makeWalletClient(address);
    return null;
  }, [address, localKey, mode]);

  return { address, mode, error, connecting, connectWallet, connectLocal, disconnect, getSignerClient };
}
