'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bounty, Submission } from '@/lib/types';
import { fetchBounty, fetchSubmissions, sendEvaluate, sendCancel, sendAppeal, sendSettle, friendlyError } from '@/lib/contract';
import { attoToGen, shortAddr, statusColor } from '@/lib/format';
import { useTransaction } from '@/hooks/useTransaction';
import { ArrowLeft, FileCheck, XCircle, Scale, DollarSign } from 'lucide-react';

interface BountyDetailProps {
  bountyId: string | null;
  wallet: {
    address: string | null;
    getSignerClient: () => ReturnType<typeof import('@/lib/contract').makeWalletClient> | null;
  };
  onBack: () => void;
  onSubmitWork: (id: string) => void;
  onRefresh: () => void;
}

const LIFECYCLE_STATES = ['OPEN', 'SUBMITTED', 'EVALUATING', 'AWARDED', 'DISPUTED', 'SETTLED', 'CANCELLED'];

export default function BountyDetail({ bountyId, wallet, onBack, onSubmitWork, onRefresh }: BountyDetailProps) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const { tx, execute, reset, explorerLink } = useTransaction();

  const load = useCallback(async () => {
    if (!bountyId) return;
    setLoading(true);
    setError(null);
    try {
      const [b, s] = await Promise.all([fetchBounty(bountyId), fetchSubmissions(bountyId)]);
      setBounty(b);
      setSubs(s);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [bountyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tx.phase === 'accepted' || tx.phase === 'finalized') {
      setTimeout(() => { load(); onRefresh(); reset(); }, 1500);
    }
  }, [tx.phase, load, onRefresh, reset]);

  const client = wallet.getSignerClient();
  const isSponsor = bounty && wallet.address && bounty.sponsor.toLowerCase() === wallet.address.toLowerCase();

  const handleSubmitWork = () => {
    if (bountyId) onSubmitWork(bountyId);
  };

  const handleEvaluate = () => {
    if (!client || !bountyId) return;
    execute(client, () => sendEvaluate(client, bountyId));
  };

  const handleCancel = () => {
    if (!client || !bountyId) return;
    execute(client, () => sendCancel(client, bountyId));
  };

  const handleAppeal = () => {
    if (!client || !bountyId || !appealReason.trim()) return;
    execute(client, () => sendAppeal(client, bountyId, appealReason));
  };

  const handleSettle = () => {
    if (!client || !bountyId) return;
    execute(client, () => sendSettle(client, bountyId));
  };

  if (!bountyId) {
    return (
      <div className="empty-state">
        <p>No bounty selected.</p>
        <button className="btn btn-secondary" onClick={onBack} data-control-id="bounty-back">Back to board</button>
      </div>
    );
  }

  if (loading) {
    return <div className="empty-state"><div className="loading-spinner" /><p>Loading bounty…</p></div>;
  }

  if (error || !bounty) {
    return (
      <div className="panel">
        <div className="error-msg">{error || 'Bounty not found'}</div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 12 }} data-control-id="bounty-back">Back</button>
      </div>
    );
  }

  const isEvaluating = tx.phase !== 'idle' && tx.phase !== 'error' && tx.phase !== 'accepted' && tx.phase !== 'finalized';

  return (
    <div className={isEvaluating ? 'scan-active' : ''}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 16 }} data-control-id="bounty-back">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="panel">
        <div className="detail-header">
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className="bounty-row-id">{bounty.id}</span>
              <span className="pill" style={{ color: statusColor(bounty.status) }}>{bounty.status}</span>
            </div>
            <h2 className="detail-title">{bounty.title}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--c-accent)' }}>
              {attoToGen(bounty.reward_atto)} GEN
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>Reward</div>
          </div>
        </div>

        {/* Lifecycle diagram */}
        <div className="lifecycle" aria-label="Bounty lifecycle">
          {LIFECYCLE_STATES.map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={`lifecycle-node ${bounty.status === s ? 'active' : ''}`}>{s}</span>
              {i < LIFECYCLE_STATES.length - 1 && <span className="lifecycle-arrow">→</span>}
            </span>
          ))}
        </div>

        <div className="detail-meta">
          <span>Sponsor: <code>{shortAddr(bounty.sponsor)}</code></span>
          <span>Category: {bounty.category}</span>
          <span>Submissions: {bounty.submission_ids?.length || 0}</span>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Requirements</div>
          <div className="detail-requirements">{bounty.requirements}</div>
        </div>

        {/* Evaluation result */}
        {bounty.evaluation && (
          <div className="detail-section">
            <div className="detail-section-title">FORGE Evaluation</div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <span className="pill" style={{ color: statusColor(bounty.evaluation.decision) }}>
                  {bounty.evaluation.decision}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                  Score: {bounty.evaluation.score}/100
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--c-muted)' }}>{bounty.evaluation.rationale}</p>
            </div>
          </div>
        )}

        {/* Submissions */}
        {subs.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Submissions</div>
            {subs.map((s) => (
              <div key={s.id} className="panel" style={{ padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-muted)' }}>{s.id}</span>
                  <span className="pill" style={{ color: statusColor(s.status) }}>{s.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--c-muted)', marginBottom: 4 }}>
                  Hunter: <code>{shortAddr(s.hunter)}</code>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{s.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions" style={{ flexWrap: 'wrap' }}>
          {bounty.status === 'OPEN' && wallet.address && (
            <button
              className="btn btn-primary"
              onClick={handleSubmitWork}
              disabled={!client}
              data-control-id="bounty-submit-work"
            >
              <FileCheck size={14} /> Submit Work
            </button>
          )}

          {bounty.status === 'SUBMITTED' && (
            <button
              className="btn btn-primary"
              onClick={handleEvaluate}
              disabled={!client || isEvaluating}
              data-control-id="bounty-evaluate"
            >
              {isEvaluating ? 'Evaluating…' : 'Evaluate with FORGE'}
            </button>
          )}

          {bounty.status === 'AWARDED' && isSponsor && (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSettle}
                disabled={!client || isEvaluating}
                data-control-id="bounty-settle"
              >
                <DollarSign size={14} /> Settle & Pay Hunter
              </button>
              <button
                className="btn btn-danger"
                onClick={handleAppeal}
                disabled={!client || isEvaluating || !appealReason.trim()}
                data-control-id="bounty-appeal"
              >
                <Scale size={14} /> Appeal
              </button>
            </>
          )}

          {(bounty.status === 'OPEN' || bounty.status === 'DISPUTED') && isSponsor && (
            <button
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={!client || isEvaluating}
              data-control-id="bounty-cancel"
            >
              <XCircle size={14} /> Cancel & Refund
            </button>
          )}
        </div>

        {/* Appeal reason input */}
        {bounty.status === 'AWARDED' && isSponsor && (
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label" htmlFor="appeal-reason">Appeal Reason</label>
            <textarea
              id="appeal-reason"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why the evaluation should be reconsidered…"
              data-control-id="appeal-reason-input"
            />
          </div>
        )}

        {/* Transaction status */}
        {tx.phase !== 'idle' && (
          <div className={`tx-bar ${tx.phase === 'error' || tx.phase === 'undetermined' ? 'error' : tx.phase === 'accepted' || tx.phase === 'finalized' ? 'success' : ''}`}>
            <span className="tx-phase">{tx.phase}</span>
            {tx.draft?.decision && (
              <span className="pill" style={{ color: statusColor(tx.draft.decision) }}>{tx.draft.decision}</span>
            )}
            {tx.draft?.score !== undefined && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Score: {tx.draft.score}</span>
            )}
            {tx.error && <span className="error-msg">{tx.error}</span>}
            {explorerLink && (
              <a href={explorerLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                Explorer ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
