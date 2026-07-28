'use client';

import { useCallback, useState } from 'react';
import {
  pollUntilDecided,
  friendlyError,
  explorerTx,
  type LeaderDraft,
  type SignerClient,
} from '@/lib/contract';

export type TxPhase =
  | 'idle'
  | 'signing'
  | 'submitted'
  | 'proposing'
  | 'committing'
  | 'revealing'
  | 'accepted'
  | 'finalized'
  | 'undetermined'
  | 'error';

export interface TxState {
  phase: TxPhase;
  hash: string | null;
  draft: LeaderDraft | null;
  error: string | null;
}

const INIT: TxState = { phase: 'idle', hash: null, draft: null, error: null };

export function useTransaction() {
  const [tx, setTx] = useState<TxState>(INIT);

  const reset = useCallback(() => setTx(INIT), []);

  const execute = useCallback(
    async (
      client: SignerClient,
      action: () => Promise<`0x${string}`>,
    ) => {
      setTx({ phase: 'signing', hash: null, draft: null, error: null });
      try {
        const hash = await action();
        setTx({ phase: 'submitted', hash, draft: null, error: null });

        const result = await pollUntilDecided(client, hash, (status, draft) => {
          const phase = status.toLowerCase() as TxPhase;
          setTx((prev) => ({ ...prev, phase, draft: draft ?? prev.draft }));
        });

        if (result.status === 'ACCEPTED' || result.status === 'FINALIZED') {
          setTx((prev) => ({
            ...prev,
            phase: result.status.toLowerCase() as TxPhase,
            draft: result.draft ?? prev.draft,
          }));
        } else {
          setTx((prev) => ({
            ...prev,
            phase: result.status === 'UNDETERMINED' ? 'undetermined' : 'error',
            error: result.status === 'UNDETERMINED'
              ? 'Validators could not reach consensus. Try again.'
              : 'Transaction did not finalize.',
          }));
        }
        return result;
      } catch (e) {
        setTx((prev) => ({ ...prev, phase: 'error', error: friendlyError(e) }));
        return null;
      }
    },
    [],
  );

  const explorerLink = tx.hash ? explorerTx(tx.hash) : null;

  return { tx, execute, reset, explorerLink };
}
