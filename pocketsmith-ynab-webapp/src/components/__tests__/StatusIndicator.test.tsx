import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusIndicator } from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders success status correctly', () => {
    render(<StatusIndicator status="success" />);
    
    expect(screen.getByText('success')).toBeInTheDocument();
    // Check for CheckCircle icon
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).toBeInTheDocument();
  });

  it('renders error status correctly', () => {
    render(<StatusIndicator status="error" />);
    
    expect(screen.getByText('error')).toBeInTheDocument();
    // Check for Error icon
    expect(document.querySelector('[data-testid="ErrorIcon"]')).toBeInTheDocument();
  });

  it('renders warning status correctly', () => {
    render(<StatusIndicator status="warning" />);
    
    expect(screen.getByText('warning')).toBeInTheDocument();
    // Check for Warning icon
    expect(document.querySelector('[data-testid="WarningIcon"]')).toBeInTheDocument();
  });

  it('renders syncing status correctly', () => {
    render(<StatusIndicator status="syncing" />);
    
    expect(screen.getByText('syncing')).toBeInTheDocument();
    // Check for Sync icon with rotating class
    const syncIcon = document.querySelector('[data-testid="SyncIcon"]');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon).toHaveClass('rotating');
  });

  it('renders idle status correctly', () => {
    render(<StatusIndicator status="idle" />);
    
    expect(screen.getByText('idle')).toBeInTheDocument();
    // Check for Schedule icon
    expect(document.querySelector('[data-testid="ScheduleIcon"]')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<StatusIndicator status="success" showLabel={false} />);
    
    expect(screen.queryByText('success')).not.toBeInTheDocument();
    // Icon should still be present
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<StatusIndicator status="success" showIcon={false} />);
    
    expect(screen.getByText('success')).toBeInTheDocument();
    // Icon should not be present
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).not.toBeInTheDocument();
  });

  it('renders with medium size', () => {
    render(<StatusIndicator status="success" size="medium" />);
    
    const chip = screen.getByText('success').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeMedium');
  });

  it('renders with small size by default', () => {
    render(<StatusIndicator status="success" />);
    
    const chip = screen.getByText('success').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });
});