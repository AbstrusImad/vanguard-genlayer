'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContractData } from '@/hooks/useContractData';
import { shortAddr } from '@/lib/format';
import { HAS_LIVE_CONTRACT, NETWORK_NAME } from '@/lib/contract';
import type { ScreenId } from '@/lib/types';

import Sidebar from '@/components/Sidebar';
import BountyBoard from '@/components/screens/BountyBoard';
import BountyDetail from '@/components/screens/BountyDetail';
import CreateBounty from '@/components/screens/CreateBounty';
import SubmitWork from '@/components/screens/SubmitWork';
import ReputationLedger from '@/components/screens/ReputationLedger';
import Chronicle from '@/components/screens/Chronicle';
import WalletModal from '@/components/WalletModal';

import {
  LayoutGrid,
  PlusCircle,
  Award,
  ScrollText,
  Wallet,
  RefreshCw,
} from 'lucide-react';

const SCREEN_TITLES: Record<ScreenId, string> = {
  'bounty-board': 'Bounty Board',
  'bounty-detail': 'Bounty Detail',
  'create-bounty': 'Post Bounty',
  'submit-work': 'Submit Work',
  'reputation-ledger': 'Reputation Ledger',
  'chronicle': 'Chronicle',
};

export default function Home() {
  const [screen, setScreen] = useState<ScreenId>('bounty-board');
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);

  const wallet = useWallet();
  const data = useContractData();

  const navigate = useCallback((s: ScreenId) => {
    setScreen(s);
    if (s !== 'bounty-detail') setSelectedBountyId(null);
  }, []);

  const viewBounty = useCallback((id: string) => {
    setSelectedBountyId(id);
    setScreen('bounty-detail');
  }, []);

  const submitForBounty = useCallback((id: string) => {
    setSelectedBountyId(id);
    setScreen('submit-work');
  }, []);

  const isLive = HAS_LIVE_CONTRACT;
  const activeNav = screen === 'bounty-detail' ? 'bounty-board' : screen;

  const renderScreen = () => {
    switch (screen) {
      case 'bounty-board':
        return (
          <BountyBoard
            bounties={data.bounties}
            loading={data.loading}
            error={data.error}
            onViewDetail={viewBounty}
          />
        );
      case 'bounty-detail':
        return (
          <BountyDetail
            bountyId={selectedBountyId}
            wallet={wallet}
            onBack={() => navigate('bounty-board')}
            onSubmitWork={submitForBounty}
            onRefresh={data.refresh}
          />
        );
      case 'create-bounty':
        return (
          <CreateBounty
            wallet={wallet}
            onSuccess={() => {
              data.refresh();
              navigate('bounty-board');
            }}
          />
        );
      case 'submit-work':
        return (
          <SubmitWork
            bountyId={selectedBountyId}
            wallet={wallet}
            onSuccess={() => {
              data.refresh();
              if (selectedBountyId) viewBounty(selectedBountyId);
            }}
          />
        );
      case 'reputation-ledger':
        return <ReputationLedger />;
      case 'chronicle':
        return (
          <Chronicle
            events={data.chronicle}
            loading={data.loading}
            error={data.error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar active={activeNav} onNavigate={navigate} />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{SCREEN_TITLES[screen]}</h1>
            {data.stats && (
              <div className="topbar-stats">
                <span>Bounties <span className="stat-value">{data.stats.bounties}</span></span>
                <span>Subs <span className="stat-value">{data.stats.submissions}</span></span>
                <span>Evals <span className="stat-value">{data.stats.evaluations}</span></span>
                <span>Awarded <span className="stat-value">{data.stats.total_awarded_gen} GEN</span></span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={data.refresh}
              disabled={data.loading}
              data-control-id="refresh-data"
              aria-label="Refresh data"
            >
              <RefreshCw size={14} />
            </button>
            <button
              className={`wallet-chip ${wallet.address ? 'connected' : ''}`}
              onClick={() => wallet.address ? wallet.disconnect() : setShowWallet(true)}
              data-control-id="wallet-toggle"
            >
              <Wallet size={14} />
              {wallet.address ? shortAddr(wallet.address) : 'Connect'}
            </button>
          </div>
        </header>

        <main className="content">
          {!isLive && (
            <div className="error-msg" style={{ marginBottom: 16 }}>
              No live contract configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS to connect.
            </div>
          )}
          {renderScreen()}
        </main>
      </div>

      {showWallet && (
        <WalletModal
          wallet={wallet}
          onClose={() => setShowWallet(false)}
        />
      )}
    </div>
  );
}
