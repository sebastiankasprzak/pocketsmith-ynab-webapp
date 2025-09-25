# iOS Scroll Bug Fix - Account Mapping Modal

## Issue Description
Users experienced a JavaScript error on iOS Safari when trying to add new account mappings:
```
TypeError: null is not an object (evaluating 'e.scrollTop')
```

This error occurred specifically when both PocketSmith and YNAB account fields were selected in the mapping creation modal.

## Root Cause
The issue was caused by multiple Material-UI components trying to access scroll properties on iOS Safari:
1. **List/ListItem components** in `IOSModalPicker` and `IOSActionSheet`
2. **Backdrop components** in `IOSModalPicker` and `IOSBottomSheet`
3. **Dialog component** in `IOSActionSheet`
4. **Fade component** in `IOSMappingCreationModal`

When selections were made rapidly, MUI's internal scroll handling attempted to access `scrollTop` on null DOM elements, which is a known iOS Safari bug.

## Solution Implemented

### 1. Replaced All Material-UI Scroll-Sensitive Components

#### IOSModalPicker.tsx
- Removed `List`, `ListItem`, `ListItemText`, and `Backdrop` components
- Replaced with custom scrollable container using `Box` with iOS-safe scrolling
- Added React Portal for proper DOM isolation
- Added iOS-specific body scroll prevention

#### IOSActionSheet.tsx
- Removed `Dialog`, `List`, `ListItem`, and `Button` components
- Replaced with custom portal-based modal implementation
- Added custom slide-up animation using CSS keyframes
- Added iOS-specific body scroll prevention

#### IOSBottomSheet.tsx
- Removed `Backdrop` component
- Replaced with custom backdrop using `Box`
- Enhanced iOS-specific body scroll prevention

#### IOSMappingCreationModal.tsx
- Removed `Fade` component
- Replaced with custom opacity-based transition
- Removed unused MUI imports

### 2. Enhanced iOS Scroll Prevention
Added comprehensive body scroll prevention for all modals:
```tsx
document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.body.style.width = '100%';
```

### 3. Added React Portals
- All modals now use `createPortal(component, document.body)`
- Ensures modals are rendered outside the normal DOM tree
- Prevents scroll event bubbling issues

### 4. Added Async State Updates
- Used `requestAnimationFrame` in `IOSMappingCreationModal.tsx` to prevent rapid state updates
- Added small delay (50ms) in `IOSModalPicker.tsx` selection handler
- This prevents the scroll event race condition that caused the null reference

### 5. Added React.memo Optimization
- Wrapped components in `React.memo` to prevent unnecessary re-renders
- Reduces the likelihood of triggering the scroll bug during rapid interactions

### 6. Enhanced Error Handling
- Added test case to verify rapid selection changes don't cause errors
- Added proper cleanup in useEffect hooks to prevent memory leaks

## Files Modified
- `pocketsmith-ynab-webapp/src/components/IOSModalPicker.tsx`
- `pocketsmith-ynab-webapp/src/components/IOSMappingCreationModal.tsx`
- `pocketsmith-ynab-webapp/src/components/IOSActionSheet.tsx`
- `pocketsmith-ynab-webapp/src/components/IOSBottomSheet.tsx`
- `pocketsmith-ynab-webapp/src/components/__tests__/IOSMappingCreationModal.test.tsx`

## Testing
The fix has been tested to ensure:
1. No console errors when rapidly selecting accounts
2. Smooth scrolling behavior on iOS devices
3. Maintained functionality across all platforms
4. Proper haptic feedback still works
5. All existing tests continue to pass
6. TypeScript compilation is clean

## Key Technical Changes

### Custom Scrollable Container
```tsx
<Box 
  sx={{ 
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  }}
>
```

### iOS Body Scroll Prevention
```tsx
useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  return () => {
    // Cleanup on unmount
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  };
}, [open]);
```

### React Portal Implementation
```tsx
return createPortal(
  <CustomModal />,
  document.body
);
```

## Prevention Guidelines
To prevent similar issues in the future:
1. **Avoid MUI scroll-sensitive components** in iOS-specific modals (List, Dialog, Backdrop)
2. **Use React Portals** for all modal implementations
3. **Implement custom scroll containers** with iOS-safe properties
4. **Add comprehensive body scroll prevention** for iOS
5. **Use `requestAnimationFrame`** for rapid state updates
6. **Test on actual iOS devices** during development
7. **Monitor console for scroll-related errors** during testing