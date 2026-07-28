'use client';

import { useState, useCallback } from 'react';
import { fetchReputation } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import type { Reputation } from '@/lib/types';
import { Search, Award } from 'lucide-react';

export default function ReputationLedger() {
  const [query, setQuery] = useState('');
  const [rep, setRep] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setRep(null);
    try {
      const r = await fetchReputation(query.trim());
      setRep(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [query]);

  const avgScore = rep && (rep.approved + rep.rejected > 0)
    ? Math.round(rep.total_score / (rep.approved + rep.rejected))
    : 0;

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>
          Hunter Reputation Lookup
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter address (0x…)"
            data-control-id="reputation-lookup-input"
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
          <button
            className="btn btn-primary"
            onClick={handleLookup}
            disabled={loading || !query.trim()}
            data-control-id="reputation-lookup"
          >
            <Search size={14} />
            {loading ? '…' : 'Lookup'}
          </button>
        </div>
        {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      {loading && (
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>Fetching reputation…</p>
        </div>
      )}

      {rep && !loading && (
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Award size={24} style={{ color: 'var(--c-accent)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{rep.address}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>Hunter Reputation</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="panel" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-awarded)', fontFamily: 'var(--font-mono)' }}>
                {rep.approved}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', textTransform: 'uppercase' }}>Approved</div>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-disputed)', fontFamily: 'var(--font-mono)' }}>
                {rep.rejected}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', textTransform: 'uppercase' }}>Rejected</div>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-accent)', fontFamily: 'var(--font-mono)' }}>
                {avgScore}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', textTransform: 'uppercase' }}>Avg Score</div>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {rep.approved + rep.rejected}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', textTransform: 'uppercase' }}>Total Evals</div>
            </div>
          </div>
        </div>
      )}

      {!rep && !loading && !error && (
        <div className="empty-state">
          <Award size={48} />
          <p>Enter an address to look up hunter reputation.</p>
        </div>
      )}
    </div>
  );
}
