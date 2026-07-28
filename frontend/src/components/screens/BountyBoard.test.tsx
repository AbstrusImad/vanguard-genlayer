import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BountyBoard from './BountyBoard';
import type { Bounty } from '@/lib/types';

const makeBounty = (overrides: Partial<Bounty> = {}): Bounty => ({
  id: 'bounty-1',
  sponsor: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  title: 'Build a REST API',
  category: 'Engineering',
  requirements: 'Create a Python REST API with FastAPI',
  reward_atto: '5000000000000000000',
  status: 'OPEN',
  submission_ids: [],
  evaluation: null,
  ...overrides,
});

describe('BountyBoard', () => {
  it('renders bounty rows when data is present', () => {
    const bounties = [
      makeBounty({ id: 'b1', title: 'First Bounty' }),
      makeBounty({ id: 'b2', title: 'Second Bounty' }),
    ];

    render(
      <BountyBoard bounties={bounties} loading={false} error={null} onViewDetail={vi.fn()} />,
    );

    expect(screen.getByText('First Bounty')).toBeInTheDocument();
    expect(screen.getByText('Second Bounty')).toBeInTheDocument();
  });

  it('shows loading state with spinner', () => {
    render(
      <BountyBoard bounties={[]} loading={true} error={null} onViewDetail={vi.fn()} />,
    );

    expect(screen.getByText('Loading bounties…')).toBeInTheDocument();
  });

  it('shows empty state when no bounties match the filter', () => {
    render(
      <BountyBoard bounties={[]} loading={false} error={null} onViewDetail={vi.fn()} />,
    );

    expect(screen.getByText('No bounties match this filter.')).toBeInTheDocument();
  });

  it('calls onViewDetail when a bounty row is clicked', () => {
    const onViewDetail = vi.fn();
    const bounties = [makeBounty({ id: 'b1' })];

    render(
      <BountyBoard bounties={bounties} loading={false} error={null} onViewDetail={onViewDetail} />,
    );

    fireEvent.click(screen.getByTestId('bounty-view-detail'));
    expect(onViewDetail).toHaveBeenCalledOnce();
    expect(onViewDetail).toHaveBeenCalledWith('b1');
  });

  it('filters bounties when a status filter button is clicked', () => {
    const bounties = [
      makeBounty({ id: 'open-1', status: 'OPEN', title: 'Open Bounty' }),
      makeBounty({ id: 'settled-1', status: 'SETTLED', title: 'Settled Bounty' }),
    ];

    render(
      <BountyBoard bounties={bounties} loading={false} error={null} onViewDetail={vi.fn()} />,
    );

    // Initially shows both (ALL filter)
    expect(screen.getByText('Open Bounty')).toBeInTheDocument();
    expect(screen.getByText('Settled Bounty')).toBeInTheDocument();

    // Click the SETTLED filter
    const settledFilter = screen.getByRole('button', { name: 'SETTLED' });
    fireEvent.click(settledFilter);

    expect(screen.queryByText('Open Bounty')).not.toBeInTheDocument();
    expect(screen.getByText('Settled Bounty')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(
      <BountyBoard bounties={[]} loading={false} error="RPC connection failed" onViewDetail={vi.fn()} />,
    );

    expect(screen.getByText('RPC connection failed')).toBeInTheDocument();
  });
});
