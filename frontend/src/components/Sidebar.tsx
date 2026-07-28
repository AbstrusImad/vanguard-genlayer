'use client';

import type { ScreenId } from '@/lib/types';
import {
  LayoutGrid,
  PlusCircle,
  Award,
  ScrollText,
} from 'lucide-react';

const NAV_ITEMS: { id: ScreenId; controlId: string; label: string; icon: React.ReactNode }[] = [
  { id: 'bounty-board', controlId: 'nav-bounties', label: 'Bounties', icon: <LayoutGrid size={18} /> },
  { id: 'create-bounty', controlId: 'nav-create', label: 'Post Bounty', icon: <PlusCircle size={18} /> },
  { id: 'reputation-ledger', controlId: 'nav-reputation', label: 'Reputation', icon: <Award size={18} /> },
  { id: 'chronicle', controlId: 'nav-chronicle', label: 'Chronicle', icon: <ScrollText size={18} /> },
];

interface SidebarProps {
  active: string;
  onNavigate: (screen: ScreenId) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">VANGUARD</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            data-control-id={item.controlId}
            aria-current={active === item.id ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
