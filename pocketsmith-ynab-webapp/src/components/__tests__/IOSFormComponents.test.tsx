import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import { IOSTextField } from '../IOSTextField';
import { IOSPicker } from '../IOSPicker';
import { IOSSegmentedControl } from '../IOSSegmentedControl';
import { IOSToggle } from '../IOSToggle';

// Mock the haptic feedback hook
vi.mock('../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn(),
  }),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('IOSTextField', () => {
  it('renders with label and placeholder', () => {
    renderWithTheme(
      <IOSTextField
        label="Test Label"
        value=""
        onChange={() => {}}
        placeholder="Test placeholder"
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('calls onChange when text is entered', () => {
    const handleChange = vi.fn();

    renderWithTheme(
      <IOSTextField
        label="Test"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Test');
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  it('shows character count when enabled', () => {
    renderWithTheme(
      <IOSTextField
        label="Test"
        value="hello"
        onChange={() => {}}
        maxLength={10}
        showCharacterCount
      />
    );

    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('shows clear button when clearable and has value', () => {
    const handleChange = vi.fn();
    const handleClear = vi.fn();

    renderWithTheme(
      <IOSTextField
        label="Test"
        value="hello"
        onChange={handleChange}
        clearable
        onClear={handleClear}
      />
    );

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
    expect(handleClear).toHaveBeenCalled();
  });

  it('shows error state correctly', () => {
    renderWithTheme(
      <IOSTextField
        label="Test"
        value=""
        onChange={() => {}}
        error
        helperText="Error message"
      />
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

describe('IOSPicker', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  it('renders with placeholder when no value selected', () => {
    renderWithTheme(
      <IOSPicker
        options={mockOptions}
        value=""
        onChange={() => {}}
        placeholder="Select option"
      />
    );

    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    renderWithTheme(
      <IOSPicker
        options={mockOptions}
        value="opt2"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
});

describe('IOSSegmentedControl', () => {
  const mockOptions = [
    { label: 'First', value: 'first' },
    { label: 'Second', value: 'second' },
    { label: 'Third', value: 'third' },
  ];

  it('renders all options', () => {
    renderWithTheme(
      <IOSSegmentedControl
        options={mockOptions}
        value="first"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('calls onChange when option is clicked', () => {
    const handleChange = vi.fn();

    renderWithTheme(
      <IOSSegmentedControl
        options={mockOptions}
        value="first"
        onChange={handleChange}
      />
    );

    const secondOption = screen.getByText('Second');
    fireEvent.click(secondOption);

    expect(handleChange).toHaveBeenCalledWith('second');
  });
});

describe('IOSToggle', () => {
  it('renders with label', () => {
    renderWithTheme(
      <IOSToggle
        checked={false}
        onChange={() => {}}
        label="Test Toggle"
      />
    );

    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();

    renderWithTheme(
      <IOSToggle
        checked={false}
        onChange={handleChange}
        label="Test Toggle"
      />
    );

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('shows description when provided', () => {
    renderWithTheme(
      <IOSToggle
        checked={false}
        onChange={() => {}}
        label="Test Toggle"
        description="This is a test description"
      />
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders without label', () => {
    renderWithTheme(
      <IOSToggle
        checked={false}
        onChange={() => {}}
      />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });
});