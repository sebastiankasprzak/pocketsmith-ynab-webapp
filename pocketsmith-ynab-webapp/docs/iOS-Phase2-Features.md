# iOS Phase 2 Features Documentation

## Overview

Phase 2 of the iOS native experience implementation adds advanced iOS-specific components and interactions that provide a truly native feel on iOS devices. These features build upon the Phase 1 foundation to create a comprehensive iOS-like experience.

## New Components

### 1. IOSContextMenu
**File**: `src/components/IOSContextMenu.tsx`

A long-press context menu that mimics iOS's native context menu behavior.

**Features**:
- Long press detection (500ms)
- Haptic feedback on activation
- Backdrop blur effect
- Smooth animations
- Support for destructive actions
- Disabled state handling

**Usage**:
```tsx
import { IOSContextMenu } from '../components/IOSContextMenu';

const actions = [
  {
    label: 'Edit',
    icon: <EditIcon />,
    onAction: () => console.log('Edit clicked')
  },
  {
    label: 'Delete',
    icon: <DeleteIcon />,
    destructive: true,
    onAction: () => console.log('Delete clicked')
  }
];

<IOSContextMenu actions={actions}>
  <YourContent />
</IOSContextMenu>
```

### 2. IOSBottomSheet
**File**: `src/components/IOSBottomSheet.tsx`

A modal that slides up from the bottom, similar to iOS action sheets and modals.

**Features**:
- Swipe-down to dismiss
- Backdrop blur
- Multiple height options (auto, half, full)
- Smooth slide animations
- Safe area handling
- Optional drag handle

**Usage**:
```tsx
import { IOSBottomSheet } from '../components/IOSBottomSheet';

<IOSBottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
  height="half"
  showHandle={true}
>
  <YourSheetContent />
</IOSBottomSheet>
```

### 3. IOSSearchBar
**File**: `src/components/IOSSearchBar.tsx`

A native iOS-style search bar with proper animations and behavior.

**Features**:
- iOS-style rounded design
- Animated cancel button
- Clear button with icon
- Focus/blur animations
- Proper keyboard handling
- Placeholder animations

**Usage**:
```tsx
import { IOSSearchBar } from '../components/IOSSearchBar';

<IOSSearchBar
  placeholder="Search accounts..."
  value={searchValue}
  onChange={setSearchValue}
  showCancelButton={true}
  onCancel={() => setSearchValue('')}
/>
```

### 4. IOSSegmentedControl
**File**: `src/components/IOSSegmentedControl.tsx`

A native iOS segmented control for switching between options.

**Features**:
- Smooth selection animations
- Multiple sizes (small, medium, large)
- Full-width option
- Disabled state support
- Haptic feedback on selection
- iOS-style visual design

**Usage**:
```tsx
import { IOSSegmentedControl } from '../components/IOSSegmentedControl';

const options = [
  { value: 'accounts', label: 'Accounts' },
  { value: 'sync', label: 'Sync' },
  { value: 'settings', label: 'Settings' }
];

<IOSSegmentedControl
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  fullWidth={true}
/>
```

### 5. IOSToggle
**File**: `src/components/IOSToggle.tsx`

A native iOS-style toggle switch.

**Features**:
- Smooth toggle animations
- Multiple sizes and colors
- Haptic feedback
- Disabled state
- Label support
- iOS-accurate visual design

**Usage**:
```tsx
import { IOSToggle } from '../components/IOSToggle';

<IOSToggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable notifications"
  color="success"
  size="medium"
/>
```

### 6. IOSNotification System
**File**: `src/components/IOSNotification.tsx`

A comprehensive notification system with iOS-style alerts.

**Features**:
- Multiple notification types (success, error, warning, info)
- Slide-in animations from top or bottom
- Auto-dismiss with configurable duration
- Haptic feedback based on type
- Backdrop blur effects
- Stacking support for multiple notifications

**Usage**:
```tsx
import { useIOSNotifications } from '../components/IOSNotification';

const { showSuccess, showError, NotificationContainer } = useIOSNotifications();

// In your component
<NotificationContainer />

// Trigger notifications
showSuccess('Success!', 'Operation completed successfully');
showError('Error!', 'Something went wrong');
```

### 7. IOSLoadingStates
**File**: `src/components/IOSLoadingStates.tsx`

A collection of iOS-style loading indicators and states.

**Components**:
- **IOSSpinner**: Native iOS activity indicator
- **IOSSkeleton**: Skeleton loading placeholders
- **IOSLoadingOverlay**: Overlay with blur effect
- **IOSProgressBar**: iOS-style progress indicator
- **IOSPulsingDot**: Animated status indicator

**Usage**:
```tsx
import { 
  IOSSpinner, 
  IOSSkeleton, 
  IOSLoadingOverlay, 
  IOSProgressBar 
} from '../components/IOSLoadingStates';

// Spinner
<IOSSpinner size="medium" color="primary" />

// Skeleton
<IOSSkeleton width="100%" height="20px" animation="pulse" />

// Loading overlay
<IOSLoadingOverlay loading={isLoading} message="Processing...">
  <YourContent />
</IOSLoadingOverlay>

// Progress bar
<IOSProgressBar progress={75} showLabel={true} color="success" />
```

## Enhanced Hooks

### useIOSFeatures
**File**: `src/hooks/useIOSFeatures.ts`

A comprehensive hook that provides iOS device detection and feature utilities.

**Features**:
- Device detection (iOS, Safari, standalone mode)
- Capability detection (haptic, touch, notifications)
- Screen information and safe area insets
- Utility functions for iOS-specific behaviors
- Integration with other iOS hooks

**Usage**:
```tsx
import { useIOSFeatures } from '../hooks/useIOSFeatures';

const {
  isIOS,
  isStandalone,
  hasHapticFeedback,
  screenInfo,
  triggerHaptic,
  requestNotificationPermission,
  addToHomeScreen
} = useIOSFeatures();
```

## Enhanced Styling

### Advanced CSS Animations
**File**: `src/styles/ios.css` (Phase 2 additions)

New CSS classes and animations for Phase 2 components:

- Context menu scale animations
- Bottom sheet slide transitions
- Search bar focus effects
- Segmented control selection animations
- Toggle switch transitions
- Loading state animations
- Notification slide animations
- Haptic feedback visual cues
- Progress bar stripe animations
- Dark mode enhancements
- Accessibility improvements

## Integration Examples

### Complete iOS Page Example

```tsx
import React, { useState } from 'react';
import {
  IOSLayout,
  IOSCard,
  IOSButton,
  IOSSearchBar,
  IOSSegmentedControl,
  IOSToggle,
  IOSBottomSheet,
  IOSContextMenu,
  useIOSNotifications
} from '../components';

export const MyIOSPage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [segment, setSegment] = useState('accounts');
  const [toggle, setToggle] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const { showSuccess, NotificationContainer } = useIOSNotifications();

  const contextActions = [
    {
      label: 'Edit',
      onAction: () => showSuccess('Edit', 'Opening editor...')
    }
  ];

  return (
    <IOSLayout title="My Page">
      <NotificationContainer />
      
      <IOSCard>
        <IOSSearchBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search..."
        />
      </IOSCard>

      <IOSCard>
        <IOSSegmentedControl
          options={[
            { value: 'accounts', label: 'Accounts' },
            { value: 'sync', label: 'Sync' }
          ]}
          value={segment}
          onChange={setSegment}
          fullWidth
        />
      </IOSCard>

      <IOSCard>
        <IOSToggle
          checked={toggle}
          onChange={setToggle}
          label="Enable feature"
        />
      </IOSCard>

      <IOSContextMenu actions={contextActions}>
        <IOSCard>
          <p>Long press this card for context menu</p>
        </IOSCard>
      </IOSContextMenu>

      <IOSButton
        variant="primary"
        fullWidth
        onClick={() => setSheetOpen(true)}
      >
        Open Settings
      </IOSButton>

      <IOSBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Settings"
      >
        <p>Sheet content here</p>
      </IOSBottomSheet>
    </IOSLayout>
  );
};
```

## Testing and Preview

### Mobile Preview Setup

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Click device toolbar icon
   - Select iPhone/iPad model
   - Set to responsive mode for custom sizes

2. **Safari Responsive Design**:
   - Enable Developer menu in Safari preferences
   - Use Develop > Enter Responsive Design Mode
   - Select iOS device presets

3. **Firefox Responsive Design**:
   - Press F12 to open DevTools
   - Click responsive design mode icon
   - Choose iOS device from dropdown

### Testing Checklist

- [ ] All components render without errors
- [ ] Haptic feedback works on supported devices
- [ ] Swipe gestures function correctly
- [ ] Context menus appear on long press
- [ ] Bottom sheets slide smoothly
- [ ] Search bar animations work
- [ ] Segmented controls respond properly
- [ ] Toggles animate smoothly
- [ ] Notifications appear and dismiss correctly
- [ ] Loading states display properly
- [ ] Dark mode support works
- [ ] Accessibility features function
- [ ] Safe area handling is correct

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: Components are designed for code splitting
2. **Animation Performance**: Uses CSS transforms and opacity for smooth animations
3. **Memory Management**: Proper cleanup in useEffect hooks
4. **Touch Handling**: Optimized touch event listeners
5. **Bundle Size**: Modular exports to minimize bundle impact

### Best Practices

1. **Use iOS components only when iOS is detected**
2. **Provide fallbacks for non-iOS devices**
3. **Test on actual iOS devices when possible**
4. **Consider reduced motion preferences**
5. **Ensure proper accessibility support**

## Browser Support

- **iOS Safari**: Full support (primary target)
- **Chrome on iOS**: Full support
- **Firefox on iOS**: Full support
- **Desktop browsers**: Graceful degradation
- **Android browsers**: Fallback to standard components

## Future Enhancements

Potential Phase 3 features:
- iOS-style date/time pickers
- Native iOS keyboard handling
- Advanced gesture recognizers
- iOS-style navigation transitions
- Integration with iOS shortcuts
- Enhanced PWA capabilities