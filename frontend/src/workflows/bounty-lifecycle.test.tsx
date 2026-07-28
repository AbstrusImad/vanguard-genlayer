import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBounty from '@/components/screens/CreateBounty';
import SubmitWork from '@/components/screens/SubmitWork';
import BountyDetail from '@/components/screens/BountyDetail';
import type { Bounty } from '@/lib/types';

// Mock contract module
const mockSendCreateBounty = vi.fn().mockResolvedValue('0xcreatehash');
const mockSendSubmitWork = vi.fn().mockResolvedValue('0xsubmithash');
const mockSendEvaluate = vi.fn().mockResolvedValue('0xevaluatehash');
const mockSendSettle = vi.fn().mockResolvedValue('0xsettlehash');

vi.mock('@/lib/contract', () => ({
  sendCreateBounty: (...args: any[]) => mockSendCreateBounty(...args),
  sendSubmitWork: (...args: any[]) => mockSendSubmitWork(...args),
  sendEvaluate: (...args: any[]) => mockSendEvaluate(...args),
  sendSettle: (...args: any[]) => mockSendSettle(...args),
  sendCancel: vi.fn(),
  sendAppeal: vi.fn(),
  fetchBounty: vi.fn(),
  fetchSubmissions: vi.fn(),
  friendlyError: vi.fn((e) => String(e)),
  pollUntilDecided: vi.fn().mockResolvedValue({ status: 'ACCEPTED', draft: null }),
  explorerTx: vi.fn((h) => `https://explorer.example.com/tx/${h}`),
  makeWalletClient: vi.fn(),
}));

// Track execute calls and simulate ACCEPTED result
let executeCalls: Array<{ action: Function }> = [];
const mockExecute = vi.fn(async (_client: any, action: any) => {
  executeCalls.push({ action });
  return { status: 'ACCEPTED', draft: null };
});
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

const hunterWallet = {
  address: HUNTER,
  getSignerClient: () => ({ writeContract: vi.fn() } as any),
};

const makeBounty = (status: Bounty['status']): Bounty => ({
  id: 'bounty-42',
  sponsor: SPONSOR,
  title: 'Build a REST API',
  category: 'Engineering',
  requirements: 'Create a Python REST API with FastAPI',
  reward_atto: '5000000000000000000',
  status,
  submission_ids: status === 'OPEN' ? [] : ['sub-1'],
  evaluation: status === 'AWARDED' || status === 'SETTLED'
    ? { decision: 'APPROVE', score: 92, rationale: 'Excellent work' }
    : null,
});

describe('Bounty Lifecycle: create → submit → evaluate → settle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeCalls = [];
  });

  it('Step 1: Creator fills form and submits a new bounty', async () => {
    const onSuccess = vi.fn();
    render(<CreateBounty wallet={sponsorWallet} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('create-bounty-title'), { target: { value: 'Build a REST API' } });
    fireEvent.change(screen.getByTestId('create-bounty-category'), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByTestId('create-bounty-requirements'), {
      target: { value: 'Create a Python REST API with FastAPI and tests' },
    });
    fireEvent.change(screen.getByTestId('create-bounty-reward'), { target: { value: '5' } });

    const submitBtn = screen.getByTestId('bounty-create');
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('Step 2: Hunter submits work for an OPEN bounty', async () => {
    const onSuccess = vi.fn();
    render(<SubmitWork bountyId="bounty-42" wallet={hunterWallet} onSuccess={onSuccess} />);

    const contentInput = screen.getByTestId('submit-work-content');
    fireEvent.change(contentInput, {
      target: { value: 'Here is my completed REST API with all endpoints implemented and tested thoroughly.' },
    });

    const submitBtn = screen.getByTestId('bounty-submit-work');
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('Step 3: Evaluate button triggers FORGE evaluation on SUBMITTED bounty', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty('SUBMITTED'));
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-42"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-evaluate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-evaluate'));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });

  it('Step 4: Sponsor settles an AWARDED bounty to pay the hunter', async () => {
    mockFetchBounty.mockResolvedValue(makeBounty('AWARDED'));
    mockFetchSubmissions.mockResolvedValue([]);

    render(
      <BountyDetail
        bountyId="bounty-42"
        wallet={sponsorWallet}
        onBack={vi.fn()}
        onSubmitWork={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bounty-settle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bounty-settle'));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledOnce();
    });
  });
});
