import React from 'react';
import { Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';

/**
 * A wrapper around MUI Select that prevents scroll-related errors
 * by ensuring safe MenuProps configuration
 */
export const SafeSelect = React.forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  // Merge user-provided MenuProps with safe defaults
  const safeMenuProps = {
    disablePortal: false, // Keep portal for proper z-index handling
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'left' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'left' as const,
    },
    PaperProps: {
      style: {
        maxHeight: 300,
        // Prevent scroll issues in the dropdown
        overflowY: 'auto' as const,
      },
      ...props.MenuProps?.PaperProps,
    },
    // Override any scroll-related props that might cause issues
    onScroll: undefined, // Remove any scroll handlers
    ...props.MenuProps,
    // Ensure our safe props take precedence
    disableScrollLock: true,
  };

  return (
    <Select
      {...props}
      ref={ref}
      MenuProps={safeMenuProps}
    />
  );
});

SafeSelect.displayName = 'SafeSelect';

export default SafeSelect;