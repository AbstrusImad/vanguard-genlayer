import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BountyDetail from './BountyDetail';
import type { Bounty, Submission } from '@/lib/types';

// Mock the contract module
vi.mock('@/lib/contract', () => ({
  fetchBounty: vi.fn(),
  fetchSubmissions: vi.fn(),
  sendEvaluate: vi.fn(),
  sendCancel: vi.fn(),
  sendSettle: vi.fn(),
  sendAppeal: vi.fn(),
  friendlyError: vi.fn((e) => String(e)),
  makeWalletClient: vi.fn(),
}));

// Mock useTransaction
const mockExecute = vi.fn();
const mockReset = vi.fn();
let mockTxState = { phase: 'idle' as const, hash: null, draft: null, error: null };

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: () => ({
    tx: mockTxState,
    execute: mockExecute,
    reset: mockReset,
    explorerLink: null,
  }),
}));

import { fetchBounty, fetchSubmissions } from '@/lib/contract';

const mockFetchBounty = vi.mocked(fetchBounty);
const mockFetchSubmissions = vi.mocked(fetchSubmissions);

const makeBounty = (overrides: Partial<Bounty> = {}): Bounty => ({
  id: 'bounty-1',
  sponsor: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  title: 'Build a REST API',
  category: 'Engineering',
  requirements: 'Create a Python REST API with FastAPI',
  reward_atto: '5000000000000000000',
  status: 'OPEN',
  submission_ids: ['sub-1'],
  evaluation: null,
  ...overrides,
});

const makeSubmission = (overrides: Partial<Submission> = {}): Submission => ({
  id: 'sub-1',
  bounty_id: 'bounty-1',
  hunter: '0x1234567890ABCDEF1234567890ABCDEF12345678',
  content: 'Here is my completed work...',
  status: 'PENDING',
  evaluation: null,
  ...overrides,
});

const mockWallet = (address: string | null = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12') => ({
  address,
  getSignerClient: () => address ? ({ writeContract: vi.fn() } as any) : null,
});

describe('BountyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTxState = { phase: 'idle', hash: null, draft: null, error: null };
    mockFetchSubmissions.mockResolvedValue([]);
  });

  it('shows loading state while fetching', () => {
    mockFetchBounty.mockImplementation(() => new Promise(() => {})); // never resolves
    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={mockWallet()}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText('Loading bounty…')).toBeInTheDocument();
  });

  it('shows bounty details when loaded', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    mockFetchSubmissions.mockResolvedValue([makeSubmission()]);

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={mockWallet()}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Build a REST API')).toBeInTheDocument();
    });

    expect(screen.getByText('Create a Python REST API with FastAPI')).toBeInTheDocument();
    expect(screen.getByText('Category: Engineering')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockFetchBounty.mockRejectedValue(new Error('Network error'));
    mockFetchSubmissions.mockRejectedValue(new Error('Network error'));

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={mockWallet()}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty());
    const onBack = vi.fn();

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={mockWallet()}
        onBack={onBack}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-back')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('calls onSubmitWork when submit work button is clicked for OPEN bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty({ status: 'OPEN' }));
    const onSubmitWork = vi.fn();
    const wallet = mockWallet('0xDifferentAddress1234567890ABCDEF1234567890');

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={wallet}
        onBack={vi.fn()}
        onSubmitWork={onSubmitWork}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-submit-work')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-submit-work'));
    expect(onSubmitWork).toHaveBeenCalledOnce();
    expect(onSubmitWork).toHaveBeenCalledWith('bounty-1');
  });

  it('calls evaluate handler when evaluate button is clicked for SUBMITTED bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty({ status: 'SUBMITTED' }));
    const wallet = mockWallet();

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={wallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-evaluate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-evaluate'));
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('calls cancel handler when cancel button is clicked for OPEN bounty by sponsor', async () => {
    const sponsor = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    mockFetchBounty.mockResolvedValue(makeBounty({ status: 'OPEN', sponsor }));
    const wallet = mockWallet(sponsor);

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={wallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-cancel'));
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('calls settle handler when settle button is clicked for AWARDED bounty by sponsor', async () => {
    const sponsor = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    mockFetchBounty.mockResolvedValue(makeBounty({ status: 'AWARDED', sponsor }));
    const wallet = mockWallet(sponsor);

    render(
      <BountyDetail
        bountyId="bounty-1"
        wallet={wallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-settle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-settle'));
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it('shows empty state when no bounty is selected', () => {
    render(
      <BountyDetail
        bountyId={null}
        wallet={mockWallet()}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText('No bounty selected.')).toBeInTheDocument();
  });
});
