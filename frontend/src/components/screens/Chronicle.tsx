'use client';

import type { ChronicleEvent } from '@/lib/types';
import { shortAddr } from '@/lib/format';
import { ScrollText } from 'lucide-react';

interface ChronicleProps {
  events: ChronicleEvent[];
  loading: boolean;
  error: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  bounty_created: 'Bounty Created',
  work_submitted: 'Work Submitted',
  submission_approved: 'Submission Approved',
  submission_rejected: 'Submission Rejected',
  bounty_cancelled: 'Bounty Cancelled',
  evaluation_appealed: 'Evaluation Appealed',
  bounty_settled: 'Bounty Settled',
};

export default function Chronicle({ events, loading, error }: ChronicleProps) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p>Loading chronicle…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="error-msg">{error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <ScrollText size={48} />
        <p>No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="chronicle-list">
        {[...events].reverse().map((ev, i) => (
          <div key={i} className="chronicle-item">
            <span className="chronicle-event">
              {EVENT_LABELS[ev.event] || ev.event}
            </span>
            {ev.id && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-muted)' }}>{ev.id}</span>}
            {ev.bounty && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-muted)' }}>Bounty: {ev.bounty}</span>}
            {ev.hunter && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-muted)' }}>Hunter: {shortAddr(ev.hunter)}</span>}
            {ev.reward && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-accent)' }}>{ev.reward} GEN</span>}
            {ev.refund && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-cancelled)' }}>Refund: {ev.refund} GEN</span>}
            {ev.paid && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--c-awarded)' }}>Paid: {ev.paid} GEN</span>}
            {ev.score !== undefined && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Score: {ev.score}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
