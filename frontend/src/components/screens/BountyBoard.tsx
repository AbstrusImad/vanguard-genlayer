'use client';

import { useState, useMemo } from 'react';
import type { Bounty } from '@/lib/types';
import { attoToGen, statusColor } from '@/lib/format';
import { PackageSearch } from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'OPEN', 'SUBMITTED', 'AWARDED', 'SETTLED', 'CANCELLED'] as const;

interface BountyBoardProps {
  bounties: Bounty[];
  loading: boolean;
  error: string | null;
  onViewDetail: (id: string) => void;
}

export default function BountyBoard({ bounties, loading, error, onViewDetail }: BountyBoardProps) {
  const [filter, setFilter] = useState<string>('ALL');

  const handleFilterStatus = (s: string) => setFilter(s);
  const handleViewDetail = (id: string) => onViewDetail(id);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return bounties;
    return bounties.filter((b) => b.status === filter);
  }, [bounties, filter]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p>Loading bounties…</p>
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

  return (
    <div>
      <div className="filter-bar">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => handleFilterStatus(s)}
            data-control-id="bounty-filter-status"
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={48} />
          <p>No bounties match this filter.</p>
        </div>
      ) : (
        <div className="bounty-list">
          {filtered.map((b) => (
            <button
              key={b.id}
              className="bounty-row"
              onClick={() => handleViewDetail(b.id)}
              data-control-id="bounty-view-detail"
            >
              <span className="bounty-row-id">{b.id}</span>
              <span className="bounty-row-title">{b.title}</span>
              <span className="bounty-row-category">{b.category}</span>
              <span className="pill" style={{ color: statusColor(b.status) }}>{b.status}</span>
              <span className="bounty-row-reward">{attoToGen(b.reward_atto)} GEN</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
