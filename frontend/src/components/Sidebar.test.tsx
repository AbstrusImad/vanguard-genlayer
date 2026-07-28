import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  const navItems = [
    { controlId: 'nav-bounties', screenId: 'bounty-board' },
    { controlId: 'nav-create', screenId: 'create-bounty' },
    { controlId: 'nav-reputation', screenId: 'reputation-ledger' },
    { controlId: 'nav-chronicle', screenId: 'chronicle' },
  ] as const;

  it('calls onNavigate with the correct screen ID when each nav item is clicked', () => {
    const onNavigate = vi.fn();
    render(<Sidebar active="bounty-board" onNavigate={onNavigate} />);

    for (const item of navItems) {
      onNavigate.mockClear();
      fireEvent.click(screen.getByTestId(item.controlId));
      expect(onNavigate).toHaveBeenCalledOnce();
      expect(onNavigate).toHaveBeenCalledWith(item.screenId);
    }
  });

  it('marks the active nav item with aria-current="page"', () => {
    const onNavigate = vi.fn();
    render(<Sidebar active="create-bounty" onNavigate={onNavigate} />);

    const activeBtn = screen.getByTestId('nav-create');
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
    expect(activeBtn).toHaveClass('active');

    const inactiveBtn = screen.getByTestId('nav-bounties');
    expect(inactiveBtn).not.toHaveAttribute('aria-current');
    expect(inactiveBtn).not.toHaveClass('active');
  });

  it('renders all four navigation items', () => {
    const onNavigate = vi.fn();
    render(<Sidebar active="bounty-board" onNavigate={onNavigate} />);

    for (const item of navItems) {
      expect(screen.getByTestId(item.controlId)).toBeInTheDocument();
    }
  });

  it('updates active styling when the active prop changes', () => {
    const onNavigate = vi.fn();
    const { rerender } = render(<Sidebar active="bounty-board" onNavigate={onNavigate} />);

    expect(screen.getByTestId('nav-bounties')).toHaveClass('active');
    expect(screen.getByTestId('nav-chronicle')).not.toHaveClass('active');

    rerender(<Sidebar active="chronicle" onNavigate={onNavigate} />);

    expect(screen.getByTestId('nav-bounties')).not.toHaveClass('active');
    expect(screen.getByTestId('nav-chronicle')).toHaveClass('active');
  });
});
