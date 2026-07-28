import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BountyDetail from '@/components/screens/BountyDetail';
import type { Bounty, Submission } from '@/lib/types';

// Mock contract module
const mockSendAppeal = vi.fn().mockResolvedValue('0xappealhash');
const mockSendEvaluate = vi.fn().mockResolvedValue('0xevaluatehash');

vi.mock('@/lib/contract', () => ({
  fetchBounty: vi.fn(),
  fetchSubmissions: vi.fn(),
  sendEvaluate: (...args: any[]) => mockSendEvaluate(...args),
  sendAppeal: (...args: any[]) => mockSendAppeal(...args),
  sendCancel: vi.fn(),
  sendSettle: vi.fn(),
  sendCreateBounty: vi.fn(),
  sendSubmitWork: vi.fn(),
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
const HUNTER = '0xHUNTER1234567890ABCDEF1234567890ABCDEF1234';

const sponsorWallet = {
  address: SPONSOR,
  getSignerClient: () => ({ writeContract: vi.fn() } as any),
};

const makeBounty = (overrides: Partial<Bounty> = {}): Bounty => ({
  id: 'bounty-7',
  sponsor: SPONSOR,
  title: 'Design a logo',
  category: 'Design',
  requirements: 'Design a modern logo for the Vanguard platform',
  reward_atto: '2000000000000000000',
  status: 'AWARDED',
  submission_ids: ['sub-1'],
  evaluation: { decision: 'APPROVE', score: 45, rationale: 'Minimal effort, low quality' },
  ...overrides,
});

const makeSubmission = (overrides: Partial<Submission> = {}): Submission => ({
  id: 'sub-1',
  bounty_id: 'bounty-7',
  hunter: HUNTER,
  content: 'Here is my logo design...',
  status: 'APPROVE',
  evaluation: { decision: 'APPROVE', score: 45, rationale: 'Minimal effort, low quality' },
  ...overrides,
});

describe('Evaluation Appeal Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows evaluation result for an AWARDED bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    mockFetchSubmissions.mockResolvedValue([makeSubmission()]);

    render(
      <BountyDetail
        bountyId="bounty-7"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('FORGE Evaluation')).toBeInTheDocument();
    });

    expect(screen.getByText('APPROVE')).toBeInTheDocument();
    expect(screen.getByText('Score: 45/100')).toBeInTheDocument();
    expect(screen.getByText('Minimal effort, low quality')).toBeInTheDocument();
  });

  it('appeal button is disabled until sponsor enters a reason', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-7"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-appeal')).toBeInTheDocument();
    });

    // Appeal button should be disabled without a reason
    expect(screen.getByTestId('bounty-appeal')).toBeDisabled();

    // Type a reason
    fireEvent.change(screen.getByTestId('appeal-reason-input'), {
      target: { value: 'The evaluation score is too low for the quality of work submitted' },
    });

    // Now the appeal button should be enabled
    expect(screen.getByTestId('bounty-appeal')).not.toBeDisabled();
  });

  it('submits appeal when sponsor clicks appeal button with a reason', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-7"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-appeal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('appeal-reason-input'), {
      target: { value: 'The evaluation is incorrect and unfair' },
    });

    fireEvent.click(screen.getByTestId('bounty-appeal'));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('does not show appeal button for non-sponsor on AWARDED bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    mockFetchSubmissions.mockResolvedValue([]);

    const nonSponsorWallet = {
      address: '0xSomeOtherAddress1234567890ABCDEF123456789012',
      getSignerClient: () => ({ writeContract: vi.fn() } as any),
    };

    render(
      <BountyDetail
        bountyId="bounty-7"
        wallet={nonSponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Design a logo')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('bounty-appeal')).not.toBeInTheDocument();
  });

  it('appeal input is only visible for AWARDED bounties where user is sponsor', async () => {
    // Test with SUBMITTED status — no appeal input
    mockFetchBounty.mockResolvedValue(makeBounty({ status: 'SUBMITTED', evaluation: null }));
    mockFetchSubmissions.mockResolvedValue([]);

    const { rerender } = render(
      <BountyDetail
        bountyId="bounty-7"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-evaluate')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('appeal-reason-input')).not.toBeInTheDocument();
  });
});
