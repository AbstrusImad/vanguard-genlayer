'use client';

import { useState } from 'react';
import { sendCreateBounty, friendlyError } from '@/lib/contract';
import { genToAtto } from '@/lib/format';
import { useTransaction } from '@/hooks/useTransaction';
import { PlusCircle } from 'lucide-react';

interface CreateBountyProps {
  wallet: {
    address: string | null;
    getSignerClient: () => ReturnType<typeof import('@/lib/contract').makeWalletClient> | null;
  };
  onSuccess: () => void;
}

export default function CreateBounty({ wallet, onSuccess }: CreateBountyProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [requirements, setRequirements] = useState('');
  const [reward, setReward] = useState('');
  const { tx, execute, reset } = useTransaction();

  const client = wallet.getSignerClient();
  const isValid = title.trim().length >= 3 && category.trim().length >= 2 && requirements.trim().length >= 10 && genToAtto(reward) >= 10n ** 18n;

  const handleCreateBounty = async () => {
    if (!client || !isValid) return;
    const rewardAtto = genToAtto(reward);
    const result = await execute(client, () => sendCreateBounty(client, title.trim(), category.trim(), requirements.trim(), rewardAtto));
    if (result && (result.status === 'ACCEPTED' || result.status === 'FINALIZED')) {
      setTitle('');
      setCategory('');
      setRequirements('');
      setReward('');
      reset();
      onSuccess();
    }
  };

  return (
    <div className="panel">
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Post a New Bounty</h2>

      {!wallet.address && (
        <div className="error-msg" style={{ marginBottom: 16 }}>
          Connect your wallet to post a bounty.
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="bounty-title">Title</label>
        <input
          id="bounty-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Write a Python REST API"
          data-control-id="create-bounty-title"
          maxLength={160}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bounty-category">Category</label>
        <input
          id="bounty-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Engineering, Writing, Design"
          data-control-id="create-bounty-category"
          maxLength={80}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bounty-requirements">Requirements</label>
        <textarea
          id="bounty-requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Describe what the completed work should include…"
          data-control-id="create-bounty-requirements"
          maxLength={1000}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bounty-reward">Reward (GEN)</label>
        <input
          id="bounty-reward"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder="e.g. 5"
          data-control-id="create-bounty-reward"
          type="number"
          min="1"
          step="0.1"
        />
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleCreateBounty}
          disabled={!client || !isValid || (tx.phase !== 'idle' && tx.phase !== 'error' && tx.phase !== 'accepted' && tx.phase !== 'finalized')}
          data-control-id="bounty-create"
        >
          <PlusCircle size={14} />
          {tx.phase === 'signing' ? 'Signing…' : tx.phase === 'submitted' ? 'Submitting…' : 'Post Bounty'}
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
