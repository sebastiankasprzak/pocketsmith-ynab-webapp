# Design Document

## Overview

This design document outlines the comprehensive transformation of the PocketSmith-YNAB Sync WebApp into a native iOS experience. The design leverages the existing iOS theme foundation while extending it across all pages and components to create a cohesive, native-feeling application.

The approach focuses on progressive enhancement - maintaining full functionality on all platforms while providing an enhanced iOS-native experience when detected. This ensures broad compatibility while delivering premium experiences on iOS devices.

## Architecture

### Current State Analysis

The application already has:
- ✅ iOS detection logic in `App.tsx`
- ✅ iOS theme system in `useIOSTheme.ts`
- ✅ iOS layout component in `IOSLayout.tsx`
- ✅ Basic iOS CSS classes in `ios.css`
- ✅ iOS demo components showing advanced patterns

### Enhanced Architecture

```
iOS Native Experience
├── Detection Layer (Enhanced)
│   ├── Device Detection (iOS/iPadOS)
│   ├── Capability Detection (Haptics, Safe Areas)
│   └── Progressive Enhancement Logic
├── Theme System (Extended)
│   ├── iOS Design Tokens
│   ├── Semantic Color System
│   └── Typography Scale
├── Component Library (New)
│   ├── Layout Components
│   ├── Form Components
│   ├── Navigation Components
│   └── Feedback Components
├── Page Implementations (Redesigned)
│   ├── Dashboard (iOS Native)
│   ├── Account Mappings (iOS Native)
│   ├── Balance Comparison (iOS Native)
│   └── Sync Status (iOS Native)
└── Interaction Layer (New)
    ├── Gesture Handling
    ├── Animation System
    └── Haptic Feedback
```

## Components and Interfaces

### 1. Enhanced iOS Detection System

**File:** `src/hooks/useIOSDetection.ts`

```typescript
interface IOSCapabilities {
  isIOS: boolean;
  isIPad: boolean;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  supportsHaptics: boolean;
  supportsStandalone: boolean;
  version: number;
}

interface IOSDetectionHook {
  capabilities: IOSCapabilities;
  shouldUseIOSExperience: boolean;
  deviceClass: 'phone' | 'tablet' | 'desktop';
}
```

### 2. iOS Native Component Library

**Core Components:**

```typescript
// Layout Components
IOSSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  grouped?: boolean;
}>

IOSCard: React.FC<{
  children: React.ReactNode;
  elevated?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}>

IOSListItem: React.FC<{
  primary: string;
  secondary?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  disclosure?: boolean;
  onPress?: () => void;
}>

// Form Components
IOSTextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
}>

IOSPicker: React.FC<{
  options: Array<{label: string, value: string}>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}>

IOSSegmentedControl: React.FC<{
  options: Array<{label: string, value: string}>;
  value: string;
  onChange: (value: string) => void;
}>

// Navigation Components
IOSNavigationBar: React.FC<{
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  large?: boolean;
}>

IOSTabBar: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}>

// Feedback Components
IOSProgressIndicator: React.FC<{
  progress: number;
  style?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
}>

IOSStatusBadge: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
}>

IOSActionSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    onAction: () => void;
    destructive?: boolean;
  }>;
}>
```

### 3. Page-Specific Designs

#### Dashboard Page Design

**Layout Structure:**
```
├── iOS Navigation Bar (Large Title: "Dashboard")
├── Status Summary Section
│   ├── Sync Status Card
│   ├── Quick Actions Row
│   └── Key Metrics Grid
├── Account Overview Section
│   ├── Mapping Progress Card
│   └── Balance Status Card
├── Recent Activity Section
│   └── Activity Feed List
└── Pull-to-Refresh Handler
```

**Key Changes:**
- Replace Material-UI Grid with iOS-style grouped sections
- Use iOS-style cards with proper shadows and corner radius
- Implement iOS-style progress indicators
- Add pull-to-refresh functionality
- Use iOS-style status badges and indicators

#### Account Mappings Page Design

**Layout Structure:**
```
├── iOS Navigation Bar (Large Title: "Account Mappings")
├── Statistics Section
│   └── Metrics Cards Row
├── Configuration Section
│   └── Settings Card
├── Mappings Section
│   ├── Section Header with Add Button
│   └── Mapping List Items
├── Floating Action Button (iOS-style)
└── Modal Presentations for Forms
```

**Key Changes:**
- Convert mapping cards to iOS-style list items
- Use iOS-style modal presentations for forms
- Implement iOS-style picker controls
- Add swipe actions for edit/delete
- Use iOS-style action sheets for bulk operations

#### Balance Comparison Page Design

**Layout Structure:**
```
├── iOS Navigation Bar (Large Title: "Balance Comparison")
├── Filter Controls Section
│   ├── iOS Search Bar
│   └── Segmented Control for Sorting
├── Summary Section
│   └── Discrepancy Overview Cards
├── Comparison Table Section
│   └── iOS-style Grouped Table
└── Pull-to-Refresh Handler
```

**Key Changes:**
- Replace Material-UI table with iOS-style grouped lists
- Use iOS-style search bar with proper keyboard handling
- Implement iOS-style segmented controls for filtering
- Add iOS-style disclosure indicators for detail navigation
- Use iOS-style alert styling for discrepancies

#### Sync Status Page Design

**Layout Structure:**
```
├── iOS Navigation Bar (Large Title: "Sync Status")
├── Current Status Section
│   ├── Status Overview Card
│   └── Progress Indicators
├── Controls Section
│   └── Action Buttons Row
├── Activity History Section
│   └── Timeline/Activity Feed
├── Account Details Section
│   └── Expandable Account List
└── Real-time Updates Handler
```

**Key Changes:**
- Use iOS-style status cards with visual hierarchy
- Implement iOS-style progress indicators with animations
- Convert activity feed to iOS-style timeline
- Use iOS-style action sheets for manual sync options
- Add iOS-style notifications for status updates

## Data Models

### iOS Theme Configuration

```typescript
interface IOSThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: {
      primary: string;
      secondary: string;
      grouped: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    separator: string;
    overlay: string;
  };
  typography: {
    largeTitle: TypographyStyle;
    title1: TypographyStyle;
    title2: TypographyStyle;
    title3: TypographyStyle;
    headline: TypographyStyle;
    body: TypographyStyle;
    callout: TypographyStyle;
    subheadline: TypographyStyle;
    footnote: TypographyStyle;
    caption1: TypographyStyle;
    caption2: TypographyStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    card: string;
    elevated: string;
    modal: string;
  };
}
```

### Component State Models

```typescript
interface IOSPageState {
  isRefreshing: boolean;
  scrollPosition: number;
  headerCollapsed: boolean;
  activeSheet?: string;
  hapticEnabled: boolean;
}

interface IOSInteractionState {
  pressedElements: Set<string>;
  activeGestures: Map<string, GestureState>;
  pendingAnimations: Array<AnimationConfig>;
}
```

## Error Handling

### Progressive Enhancement Error Handling

```typescript
class IOSEnhancementError extends Error {
  constructor(
    message: string,
    public fallbackComponent: React.ComponentType,
    public capability: keyof IOSCapabilities
  ) {
    super(message);
  }
}

interface ErrorBoundaryProps {
  fallback: React.ComponentType;
  onError?: (error: Error) => void;
}
```

**Error Handling Strategy:**
1. **Graceful Degradation:** If iOS-specific features fail, fall back to standard web components
2. **Capability Detection:** Check for iOS capabilities before using them
3. **Error Boundaries:** Wrap iOS-specific components with error boundaries
4. **Logging:** Log iOS-specific errors for debugging without breaking functionality

### Common Error Scenarios

1. **Haptic Feedback Unavailable:** Fall back to visual feedback only
2. **Safe Area Detection Failed:** Use standard padding values
3. **iOS Component Render Error:** Fall back to Material-UI equivalent
4. **Animation Performance Issues:** Reduce or disable animations
5. **Touch Gesture Recognition Failed:** Fall back to click handlers

## Testing Strategy

### Component Testing

```typescript
// Test iOS components with different capabilities
describe('IOSCard', () => {
  it('should render with iOS styling when iOS detected', () => {
    // Test iOS-specific styling
  });
  
  it('should fall back to standard styling when not iOS', () => {
    // Test fallback behavior
  });
  
  it('should handle press animations correctly', () => {
    // Test interaction animations
  });
});
```

### Integration Testing

```typescript
// Test page-level iOS experience
describe('Dashboard iOS Experience', () => {
  it('should use iOS layout when on iOS device', () => {
    // Test layout switching
  });
  
  it('should implement pull-to-refresh correctly', () => {
    // Test gesture handling
  });
  
  it('should maintain functionality when iOS features unavailable', () => {
    // Test progressive enhancement
  });
});
```

### Device Testing Strategy

1. **iOS Simulator Testing:** Test on various iOS device simulators
2. **Physical Device Testing:** Test on actual iOS devices with different capabilities
3. **Cross-Platform Testing:** Ensure non-iOS devices maintain functionality
4. **Accessibility Testing:** Test with VoiceOver and other accessibility features
5. **Performance Testing:** Measure animation performance and memory usage

### Accessibility Considerations

1. **VoiceOver Support:** All iOS components must have proper accessibility labels
2. **Dynamic Type:** Text must scale with user preferences
3. **High Contrast Mode:** Colors must meet accessibility contrast requirements
4. **Touch Target Sizes:** All interactive elements must meet 44pt minimum size
5. **Reduced Motion:** Animations must respect user motion preferences

## Implementation Phases

### Phase 1: Foundation (1-2 weeks)
- Enhance iOS detection system
- Extend iOS theme with complete design tokens
- Create core iOS component library
- Set up error boundaries and fallback system

### Phase 2: Dashboard Transformation (1 week)
- Redesign Dashboard with iOS-native layout
- Implement iOS-style cards and sections
- Add pull-to-refresh functionality
- Integrate iOS-style progress indicators

### Phase 3: Account Mappings Enhancement (1 week)
- Convert to iOS-style list layout
- Implement iOS modal presentations
- Add iOS picker controls
- Implement swipe actions

### Phase 4: Balance Comparison & Sync Status (1 week)
- Redesign Balance Comparison with iOS table styles
- Transform Sync Status with iOS progress patterns
- Add iOS search and filtering controls
- Implement iOS-style notifications

### Phase 5: Polish & Testing (1 week)
- Add haptic feedback where supported
- Implement advanced iOS gestures
- Performance optimization
- Comprehensive testing across devices
- Accessibility compliance verification

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Load iOS-specific components only when needed
2. **Code Splitting:** Separate iOS-specific code into separate bundles
3. **Animation Performance:** Use CSS transforms and opacity for smooth animations
4. **Memory Management:** Properly clean up event listeners and animations
5. **Bundle Size:** Tree-shake unused iOS components on non-iOS platforms

### Monitoring

1. **Performance Metrics:** Track animation frame rates and interaction responsiveness
2. **Bundle Analysis:** Monitor impact on bundle size
3. **Error Tracking:** Monitor iOS-specific error rates
4. **User Experience Metrics:** Track user engagement and satisfaction on iOS vs other platforms