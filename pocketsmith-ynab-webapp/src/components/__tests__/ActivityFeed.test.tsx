import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFeed } from '../ActivityFeed';

const mockActivities = [
  {
    id: '1',
    type: 'sync' as const,
    status: 'success' as const,
    message: 'Synchronized 8 accounts successfully',
    timestamp: new Date(Date.now() - 300000) // 5 minutes ago
  },
  {
    id: '2',
    type: 'balance_check' as const,
    status: 'warning' as const,
    message: 'Found 2 balance discrepancies',
    timestamp: new Date(Date.now() - 900000) // 15 minutes ago
  },
  {
    id: '3',
    type: 'mapping' as const,
    status: 'error' as const,
    message: 'Failed to update account mapping',
    timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
  }
];

describe('ActivityFeed', () => {
  it('renders activity feed with title', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<ActivityFeed activities={mockActivities} title="Custom Activity Feed" />);
    
    expect(screen.getByText('Custom Activity Feed')).toBeInTheDocument();
  });

  it('renders all activities correctly', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('Synchronized 8 accounts successfully')).toBeInTheDocument();
    expect(screen.getByText('Found 2 balance discrepancies')).toBeInTheDocument();
    expect(screen.getByText('Failed to update account mapping')).toBeInTheDocument();
  });

  it('displays activity types as chips', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('sync')).toBeInTheDocument();
    expect(screen.getByText('balance check')).toBeInTheDocument();
    expect(screen.getByText('mapping')).toBeInTheDocument();
  });

  it('displays time ago for activities', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    // Should show relative time (exact text may vary based on timing)
    expect(screen.getByText(/\d+m ago/)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ActivityFeed activities={[]} isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);
    
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('Activity will appear here as operations are performed')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const mockRefresh = vi.fn();
    render(<ActivityFeed activities={mockActivities} onRefresh={mockRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not show refresh button when onRefresh is not provided', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
  });

  it('disables refresh button when loading', () => {
    const mockRefresh = vi.fn();
    render(<ActivityFeed activities={mockActivities} onRefresh={mockRefresh} isLoading={true} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('applies custom maxHeight', () => {
    render(<ActivityFeed activities={mockActivities} maxHeight={500} />);
    
    const scrollContainer = document.querySelector('[style*="max-height"]');
    expect(scrollContainer).toHaveStyle({ maxHeight: '500px' });
  });

  it('formats time correctly for different intervals', () => {
    const recentActivities = [
      {
        id: '1',
        type: 'sync' as const,
        status: 'success' as const,
        message: 'Just happened',
        timestamp: new Date(Date.now() - 30000) // 30 seconds ago
      },
      {
        id: '2',
        type: 'sync' as const,
        status: 'success' as const,
        message: 'Hours ago',
        timestamp: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ];

    render(<ActivityFeed activities={recentActivities} />);
    
    // Should show different time formats
    expect(screen.getByText(/Just now|\d+m ago/)).toBeInTheDocument();
    expect(screen.getByText(/\d+h ago/)).toBeInTheDocument();
  });
});