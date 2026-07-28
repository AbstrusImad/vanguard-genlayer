import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReputationLedger from './ReputationLedger';
import type { Reputation } from '@/lib/types';

// Mock the contract module
vi.mock('@/lib/contract', () => ({
  fetchReputation: vi.fn(),
}));

import { fetchReputation } from '@/lib/contract';

const mockFetchReputation = vi.mocked(fetchReputation);

const makeReputation = (overrides: Partial<Reputation> = {}): Reputation => ({
  address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  approved: 12,
  rejected: 3,
  total_score: 850,
  ...overrides,
});

describe('ReputationLedger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the lookup form with input and button', () => {
    render(<ReputationLedger />);

    expect(screen.getByTestId('reputation-lookup-input')).toBeInTheDocument();
    expect(screen.getByTestId('reputation-lookup')).toBeInTheDocument();
  });

  it('disables lookup button when input is empty', () => {
    render(<ReputationLedger />);
    expect(screen.getByTestId('reputation-lookup')).toBeDisabled();
  });

  it('calls fetchReputation when lookup button is clicked with an address', async () => {
    mockFetchReputation.mockResolvedValue(makeReputation());
    render(<ReputationLedger />);

    const input = screen.getByTestId('reputation-lookup-input');
    fireEvent.change(input, { target: { value: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' } });

    expect(screen.getByTestId('reputation-lookup')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('reputation-lookup'));

    await waitFor(() => {
      expect(mockFetchReputation).toHaveBeenCalledOnce();
      expect(mockFetchReputation).toHaveBeenCalledWith('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
    });
  });

  it('displays reputation data after successful lookup', async () => {
    mockFetchReputation.mockResolvedValue(makeReputation({ approved: 15, rejected: 5, total_score: 1200 }));
    render(<ReputationLedger />);

    fireEvent.change(screen.getByTestId('reputation-lookup-input'), {
      target: { value: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' },
    });
    fireEvent.click(screen.getByTestId('reputation-lookup'));

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows error message when lookup fails', async () => {
    mockFetchReputation.mockRejectedValue(new Error('Address not found'));
    render(<ReputationLedger />);

    fireEvent.change(screen.getByTestId('reputation-lookup-input'), {
      target: { value: '0xBadAddress' },
    });
    fireEvent.click(screen.getByTestId('reputation-lookup'));

    await waitFor(() => {
      expect(screen.getByText(/Address not found/)).toBeInTheDocument();
    });
  });

  it('shows empty state prompt initially', () => {
    render(<ReputationLedger />);
    expect(screen.getByText('Enter an address to look up hunter reputation.')).toBeInTheDocument();
  });
});
