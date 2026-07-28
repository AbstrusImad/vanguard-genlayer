'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bounty, Stats, ChronicleEvent } from '@/lib/types';
import { fetchBounties, fetchStats, fetchChronicle, HAS_LIVE_CONTRACT } from '@/lib/contract';

export function useContractData() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chronicle, setChronicle] = useState<ChronicleEvent[]>([]);
  const [loading, setLoading] = useState(HAS_LIVE_CONTRACT);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!HAS_LIVE_CONTRACT) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [b, s, c] = await Promise.all([
        fetchBounties(),
        fetchStats(),
        fetchChronicle(),
      ]);
      setBounties(b);
      setStats(s);
      setChronicle(c);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bounties, stats, chronicle, loading, error, refresh };
}
