import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBounty from '@/components/screens/CreateBounty';
import BountyDetail from '@/components/screens/BountyDetail';
import type { Bounty } from '@/lib/types';

// Mock contract module
const mockSendCreateBounty = vi.fn().mockResolvedValue('0xcreatehash');
const mockSendCancel = vi.fn().mockResolvedValue('0xcancelhash');

vi.mock('@/lib/contract', () => ({
  sendCreateBounty: (...args: any[]) => mockSendCreateBounty(...args),
  sendCancel: (...args: any[]) => mockSendCancel(...args),
  sendEvaluate: vi.fn(),
  sendSettle: vi.fn(),
  sendAppeal: vi.fn(),
  sendSubmitWork: vi.fn(),
  fetchBounty: vi.fn(),
  fetchSubmissions: vi.fn(),
  friendlyError: vi.fn((e) => String(e)),
  pollUntilDecided: vi.fn().mockResolvedValue({ status: 'ACCEPTED', draft: null }),
  explorerTx: vi.fn((h) => `https://explorer.example.com/tx/${h}`),
  makeWalletClient: vi.fn(),
}));

const mockExecute = vi.fn(async () => ({ status: 'ACCEPTED', draft: null }));
const mockReset = vi.fn();

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: () => ({
    tx: { phase: 'idle', hash: null, draft: null, error: null },
    execute: mockExecute,
    reset: mockReset,
    explorerLink: null,
  }),
}));

import { fetchBounty, fetchSubmissions } from '@/lib/contract';

const mockFetchBounty = vi.mocked(fetchBounty);
const mockFetchSubmissions = vi.mocked(fetchSubmissions);

const SPONSOR = '0xSPONSOR1234567890ABCDEF1234567890ABCDEF12';

const sponsorWallet = {
  address: SPONSOR,
  getSignerClient: () => ({ writeContract: vi.fn() } as any),
};

const makeBounty = (status: Bounty['status']): Bounty => ({
  id: 'bounty-99',
  sponsor: SPONSOR,
  title: 'Write documentation',
  category: 'Writing',
  requirements: 'Write comprehensive API documentation with examples',
  reward_atto: '3000000000000000000',
  status,
  submission_ids: [],
  evaluation: null,
});

describe('Bounty Cancel Workflow: create → cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Step 1: Creator posts a new bounty', async () => {
    const onSuccess = vi.fn();
    render(<CreateBounty wallet={sponsorWallet} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('create-bounty-title'), { target: { value: 'Write documentation' } });
    fireEvent.change(screen.getByTestId('create-bounty-category'), { target: { value: 'Writing' } });
    fireEvent.change(screen.getByTestId('create-bounty-requirements'), {
      target: { value: 'Write comprehensive API documentation with examples for all endpoints' },
    });
    fireEvent.change(screen.getByTestId('create-bounty-reward'), { target: { value: '3' } });

    expect(screen.getByTestId('bounty-create')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('bounty-create'));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('Step 2: Sponsor cancels an OPEN bounty and gets refund', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty('OPEN'));
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-99"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-cancel'));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('Cancel button is not visible for non-sponsor on OPEN bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty('OPEN'));
    mockFetchSubmissions.mockResolvedValue([]);

    const nonSponsorWallet = {
      address: '0xSomeOtherAddress1234567890ABCDEF123456789012',
      getSignerClient: () => ({ writeContract: vi.fn() } as any),
    };

    render(
      <BountyDetail
        bountyId="bounty-99"
        wallet={nonSponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Write documentation')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('bounty-cancel')).not.toBeInTheDocument();
  });

  it('Cancel button is visible for sponsor on DISPUTED bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty('DISPUTED'));
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-99"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-cancel')).toBeInTheDocument();
    });
  });
});
