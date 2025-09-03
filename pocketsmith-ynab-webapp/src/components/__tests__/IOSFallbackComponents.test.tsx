import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  StandardCard,
  StandardSection,
  StandardListItem,
  StandardTextField,
  StandardPicker,
  StandardButton,
  StandardProgressIndicator,
  StandardStatusBadge,
  StandardNavigationBar,
  StandardTabBar,
  StandardToggle,
  StandardNotification,
  StandardLoadingSpinner,
  IOSFallbackRegistry,
  getFallbackComponent,
} from '../IOSFallbackComponents';

describe('StandardCard', () => {
  it('renders children correctly', () => {
    render(
      <StandardCard>
        <div>Card Content</div>
      </StandardCard>
    );

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies elevated styling when elevated prop is true', () => {
    render(
      <StandardCard elevated>
        <div>Elevated Card</div>
      </StandardCard>
    );

    const card = screen.getByText('Elevated Card').closest('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-elevation4');
  });

  it('handles press events when pressable', () => {
    const onPress = vi.fn();
    
    render(
      <StandardCard pressable onPress={onPress}>
        <div>Pressable Card</div>
      </StandardCard>
    );

    fireEvent.click(screen.getByText('Pressable Card'));
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe('StandardSection', () => {
  it('renders title and children', () => {
    render(
      <StandardSection title="Test Section">
        <div>Section Content</div>
      </StandardSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(
      <StandardSection>
        <div>Section Content</div>
      </StandardSection>
    );

    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  it('applies grouped styling when grouped prop is true', () => {
    render(
      <StandardSection title="Grouped Section" grouped>
        <div>Grouped Content</div>
      </StandardSection>
    );

    const content = screen.getByText('Grouped Content').parentElement;
    expect(content).toHaveStyle({
      border: '1px solid',
      'border-radius': '4px',
      overflow: 'hidden',
    });
  });
});

describe('StandardListItem', () => {
  it('renders primary text', () => {
    render(<StandardListItem primary="Primary Text" />);
    expect(screen.getByText('Primary Text')).toBeInTheDocument();
  });

  it('renders secondary text when provided', () => {
    render(
      <StandardListItem 
        primary="Primary Text" 
        secondary="Secondary Text" 
      />
    );
    
    expect(screen.getByText('Primary Text')).toBeInTheDocument();
    expect(screen.getByText('Secondary Text')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>;
    
    render(
      <StandardListItem 
        primary="Primary Text" 
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <StandardListItem 
        primary="Primary Text" 
        action={<button>Action</button>}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('shows disclosure indicator when disclosure is true', () => {
    render(<StandardListItem primary="Primary Text" disclosure />);
    expect(screen.getByTestId('ArrowForwardIosIcon')).toBeInTheDocument();
  });

  it('handles press events', () => {
    const onPress = vi.fn();
    
    render(<StandardListItem primary="Primary Text" onPress={onPress} />);
    
    fireEvent.click(screen.getByText('Primary Text'));
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe('StandardTextField', () => {
  it('renders with label and value', () => {
    render(
      <StandardTextField 
        label="Test Label" 
        value="Test Value" 
        onChange={() => {}} 
      />
    );
    
    expect(screen.getByLabelText('Test Label')).toHaveValue('Test Value');
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    
    render(
      <StandardTextField 
        label="Test Label" 
        value="" 
        onChange={onChange} 
      />
    );
    
    fireEvent.change(screen.getByLabelText('Test Label'), {
      target: { value: 'New Value' }
    });
    
    expect(onChange).toHaveBeenCalledWith('New Value');
  });

  it('applies correct input type', () => {
    render(
      <StandardTextField 
        label="Password" 
        value="" 
        onChange={() => {}} 
        type="password"
      />
    );
    
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
});

describe('StandardPicker', () => {
  const options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ];

  it('renders with options', () => {
    render(
      <StandardPicker 
        options={options}
        value="opt1"
        onChange={() => {}}
        placeholder="Select option"
      />
    );
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();
    
    render(
      <StandardPicker 
        options={options}
        value=""
        onChange={onChange}
        placeholder="Select option"
      />
    );
    
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Option 1'));
    
    expect(onChange).toHaveBeenCalledWith('opt1');
  });
});

describe('StandardButton', () => {
  it('renders with children', () => {
    render(<StandardButton>Button Text</StandardButton>);
    expect(screen.getByRole('button', { name: 'Button Text' })).toBeInTheDocument();
  });

  it('handles press events', () => {
    const onPress = vi.fn();
    
    render(<StandardButton onPress={onPress}>Click Me</StandardButton>);
    
    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('applies correct variant styling', () => {
    render(<StandardButton variant="secondary">Secondary Button</StandardButton>);
    
    const button = screen.getByRole('button', { name: 'Secondary Button' });
    expect(button).toHaveClass('MuiButton-outlined');
  });

  it('applies destructive styling', () => {
    render(<StandardButton variant="destructive">Delete</StandardButton>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('MuiButton-containedError');
  });

  it('renders with start and end icons', () => {
    const StartIcon = () => <div data-testid="start-icon">Start</div>;
    const EndIcon = () => <div data-testid="end-icon">End</div>;
    
    render(
      <StandardButton 
        startIcon={<StartIcon />} 
        endIcon={<EndIcon />}
      >
        Button
      </StandardButton>
    );
    
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<StandardButton disabled>Disabled Button</StandardButton>);
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
  });
});

describe('StandardProgressIndicator', () => {
  it('renders linear progress by default', () => {
    render(<StandardProgressIndicator progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders circular progress when specified', () => {
    render(<StandardProgressIndicator progress={75} style="circular" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveClass('MuiCircularProgress-root');
  });

  it('applies correct size', () => {
    render(<StandardProgressIndicator progress={50} size="large" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ height: '12px' });
  });
});

describe('StandardStatusBadge', () => {
  it('renders with correct text and color', () => {
    render(<StandardStatusBadge status="success" text="Success" />);
    
    const badge = screen.getByText('Success');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
  });

  it('applies correct color for different statuses', () => {
    const { rerender } = render(<StandardStatusBadge status="error" text="Error" />);
    expect(screen.getByText('Error').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    
    rerender(<StandardStatusBadge status="warning" text="Warning" />);
    expect(screen.getByText('Warning').closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
    
    rerender(<StandardStatusBadge status="info" text="Info" />);
    expect(screen.getByText('Info').closest('.MuiChip-root')).toHaveClass('MuiChip-colorInfo');
  });
});

describe('StandardNavigationBar', () => {
  it('renders title', () => {
    render(<StandardNavigationBar title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders left and right actions', () => {
    render(
      <StandardNavigationBar 
        title="Test Title"
        leftAction={<button>Left</button>}
        rightAction={<button>Right</button>}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Right' })).toBeInTheDocument();
  });

  it('applies large title styling', () => {
    render(<StandardNavigationBar title="Large Title" large />);
    
    const title = screen.getByText('Large Title');
    expect(title).toHaveClass('MuiTypography-h5');
  });
});

describe('StandardTabBar', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', icon: <div>Icon1</div>, path: '/tab1' },
    { id: 'tab2', label: 'Tab 2', icon: <div>Icon2</div>, path: '/tab2' },
  ];

  it('renders all tabs', () => {
    render(
      <StandardTabBar 
        tabs={tabs}
        activeTab="tab1"
        onTabChange={() => {}}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    
    render(
      <StandardTabBar 
        tabs={tabs}
        activeTab="tab1"
        onTabChange={onTabChange}
      />
    );
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });
});

describe('StandardToggle', () => {
  it('renders with label', () => {
    render(
      <StandardToggle 
        label="Test Toggle"
        checked={false}
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('calls onChange when toggled', () => {
    const onChange = vi.fn();
    
    render(
      <StandardToggle 
        label="Test Toggle"
        checked={false}
        onChange={onChange}
      />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(
      <StandardToggle 
        label="Disabled Toggle"
        checked={false}
        onChange={() => {}}
        disabled
      />
    );
    
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});

describe('StandardNotification', () => {
  it('renders message with correct severity', () => {
    render(
      <StandardNotification 
        type="success"
        message="Success message"
      />
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardSuccess');
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <StandardNotification 
        type="error"
        title="Error Title"
        message="Error message"
      />
    );
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <StandardNotification 
        type="info"
        message="Info message"
        onClose={onClose}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('StandardLoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<StandardLoadingSpinner />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(<StandardLoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('applies correct size', () => {
    render(<StandardLoadingSpinner size="large" />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' });
  });
});

describe('IOSFallbackRegistry', () => {
  it('contains all expected fallback components', () => {
    expect(IOSFallbackRegistry.IOSCard).toBe(StandardCard);
    expect(IOSFallbackRegistry.IOSSection).toBe(StandardSection);
    expect(IOSFallbackRegistry.IOSListItem).toBe(StandardListItem);
    expect(IOSFallbackRegistry.IOSTextField).toBe(StandardTextField);
    expect(IOSFallbackRegistry.IOSPicker).toBe(StandardPicker);
    expect(IOSFallbackRegistry.IOSButton).toBe(StandardButton);
    expect(IOSFallbackRegistry.IOSProgressIndicator).toBe(StandardProgressIndicator);
    expect(IOSFallbackRegistry.IOSStatusBadge).toBe(StandardStatusBadge);
    expect(IOSFallbackRegistry.IOSNavigationBar).toBe(StandardNavigationBar);
    expect(IOSFallbackRegistry.IOSTabBar).toBe(StandardTabBar);
    expect(IOSFallbackRegistry.IOSToggle).toBe(StandardToggle);
    expect(IOSFallbackRegistry.IOSNotification).toBe(StandardNotification);
    expect(IOSFallbackRegistry.IOSLoadingSpinner).toBe(StandardLoadingSpinner);
  });
});

describe('getFallbackComponent', () => {
  it('returns correct fallback component', () => {
    expect(getFallbackComponent('IOSCard')).toBe(StandardCard);
    expect(getFallbackComponent('IOSButton')).toBe(StandardButton);
    expect(getFallbackComponent('IOSProgressIndicator')).toBe(StandardProgressIndicator);
  });
});