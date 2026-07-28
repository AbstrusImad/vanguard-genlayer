import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateBounty from './CreateBounty';

// Mock the contract module
vi.mock('@/lib/contract', () => ({
  sendCreateBounty: vi.fn().mockResolvedValue('0xtxhash'),
  friendlyError: vi.fn((e) => String(e)),
  makeWalletClient: vi.fn(),
}));

// Mock useTransaction
const mockExecute = vi.fn();
const mockReset = vi.fn();
let mockTxPhase = 'idle' as string;

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: () => ({
    tx: { phase: mockTxPhase, hash: null, draft: null, error: null },
    execute: mockExecute,
    reset: mockReset,
    explorerLink: null,
  }),
}));

const mockWallet = (address: string | null = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12') => ({
  address,
  getSignerClient: () => address ? ({ writeContract: vi.fn() } as any) : null,
});

describe('CreateBounty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTxPhase = 'idle';
  });

  it('renders all form fields', () => {
    render(<CreateBounty wallet={mockWallet()} onSuccess={vi.fn()} />);

    expect(screen.getByTestId('create-bounty-title')).toBeInTheDocument();
    expect(screen.getByTestId('create-bounty-category')).toBeInTheDocument();
    expect(screen.getByTestId('create-bounty-requirements')).toBeInTheDocument();
    expect(screen.getByTestId('create-bounty-reward')).toBeInTheDocument();
  });

  it('shows wallet connect prompt when no wallet is connected', () => {
    render(<CreateBounty wallet={mockWallet(null)} onSuccess={vi.fn()} />);

    expect(screen.getByText('Connect your wallet to post a bounty.')).toBeInTheDocument();
  });

  it('disables submit button when form is invalid (empty fields)', () => {
    render(<CreateBounty wallet={mockWallet()} onSuccess={vi.fn()} />);

    const submitBtn = screen.getByTestId('bounty-create');
    expect(submitBtn).toBeDisabled();
  });

  it('disables submit button when title is too short', () => {
    render(<CreateBounty wallet={mockWallet()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId('create-bounty-title'), { target: { value: 'ab' } });
    fireEvent.change(screen.getByTestId('create-bounty-category'), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByTestId('create-bounty-requirements'), {
      target: { value: 'Build something great for the project' },
    });
    fireEvent.change(screen.getByTestId('create-bounty-reward'), { target: { value: '5' } });

    expect(screen.getByTestId('bounty-create')).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    render(<CreateBounty wallet={mockWallet()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId('create-bounty-title'), { target: { value: 'Build a REST API' } });
    fireEvent.change(screen.getByTestId('create-bounty-category'), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByTestId('create-bounty-requirements'), {
      target: { value: 'Create a Python REST API with FastAPI and tests' },
    });
    fireEvent.change(screen.getByTestId('create-bounty-reward'), { target: { value: '5' } });

    expect(screen.getByTestId('bounty-create')).not.toBeDisabled();
  });

  it('disables submit button when no wallet is connected even if form is valid', () => {
    render(<CreateBounty wallet={mockWallet(null)} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId('create-bounty-title'), { target: { value: 'Build a REST API' } });
    fireEvent.change(screen.getByTestId('create-bounty-category'), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByTestId('create-bounty-requirements'), {
      target: { value: 'Create a Python REST API with FastAPI and tests' },
    });
    fireEvent.change(screen.getByTestId('create-bounty-reward'), { target: { value: '5' } });

    expect(screen.getByTestId('bounty-create')).toBeDisabled();
  });
});
