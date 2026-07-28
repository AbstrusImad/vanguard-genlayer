'use client';

import { useState } from 'react';
import { sendSubmitWork } from '@/lib/contract';
import { useTransaction } from '@/hooks/useTransaction';
import { FileCheck } from 'lucide-react';

interface SubmitWorkProps {
  bountyId: string | null;
  wallet: {
    address: string | null;
    getSignerClient: () => ReturnType<typeof import('@/lib/contract').makeWalletClient> | null;
  };
  onSuccess: () => void;
}

export default function SubmitWork({ bountyId, wallet, onSuccess }: SubmitWorkProps) {
  const [content, setContent] = useState('');
  const { tx, execute, reset } = useTransaction();

  const client = wallet.getSignerClient();
  const isValid = content.trim().length >= 20;

  const handleSubmit = async () => {
    if (!client || !bountyId || !isValid) return;
    const result = await execute(client, () => sendSubmitWork(client, bountyId, content.trim()));
    if (result && (result.status === 'ACCEPTED' || result.status === 'FINALIZED')) {
      setContent('');
      reset();
      onSuccess();
    }
  };

  if (!bountyId) {
    return (
      <div className="empty-state">
        <p>No bounty selected for submission.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>
        Submit Work
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--c-muted)', marginBottom: 16 }}>
        For bounty <code>{bountyId}</code>
      </p>

      {!wallet.address && (
        <div className="error-msg" style={{ marginBottom: 16 }}>
          Connect your wallet to submit work.
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="submission-content">Your Submission</label>
        <textarea
          id="submission-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your completed work in detail…"
          data-control-id="submit-work-content"
          maxLength={2000}
          style={{ minHeight: 200 }}
        />
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!client || !isValid || (tx.phase !== 'idle' && tx.phase !== 'error' && tx.phase !== 'accepted' && tx.phase !== 'finalized')}
          data-control-id="bounty-submit-work"
        >
          <FileCheck size={14} />
          {tx.phase === 'signing' ? 'Signing…' : tx.phase === 'submitted' ? 'Submitting…' : 'Submit Work'}
        </button>
      </div>

      {tx.phase !== 'idle' && (
        <div className={`tx-bar ${tx.phase === 'error' ? 'error' : tx.phase === 'accepted' || tx.phase === 'finalized' ? 'success' : ''}`}>
          <span className="tx-phase">{tx.phase}</span>
          {tx.error && <span className="error-msg">{tx.error}</span>}
        </div>
      )}
    </div>
  );
}
