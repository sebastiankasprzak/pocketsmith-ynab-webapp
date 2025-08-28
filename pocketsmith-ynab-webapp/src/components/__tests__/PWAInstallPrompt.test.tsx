import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('can be imported and rendered without errors', () => {
    // Basic smoke test - component should render without throwing
    const { container } = render(<PWAInstallPrompt />);
    expect(container).toBeDefined();
  });

  it('handles session storage check', () => {
    mockSessionStorage.getItem.mockReturnValue('true');
    const { container } = render(<PWAInstallPrompt />);
    // Should render without errors even when dismissed
    expect(container).toBeDefined();
  });
});