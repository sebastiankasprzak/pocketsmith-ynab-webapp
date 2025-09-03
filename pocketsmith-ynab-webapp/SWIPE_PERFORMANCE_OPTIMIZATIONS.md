# Swipe Performance Optimizations

## Overview
This document outlines the performance optimizations implemented to reduce jittery behavior during swipe gestures on iOS list items.

## Key Performance Issues Identified

1. **Frequent State Updates**: Touch move events were causing React re-renders on every pixel movement
2. **Synchronous Haptic Feedback**: Blocking the main thread during touch interactions
3. **Inefficient CSS Transforms**: Using inline styles instead of GPU-accelerated transforms
4. **Missing Performance Hints**: No `will-change` or `backface-visibility` optimizations
5. **Unthrottled Touch Events**: Touch move events firing at 60+ FPS without throttling

## Optimizations Implemented

### 1. RequestAnimationFrame (RAF) Throttling
- **Before**: Direct state updates on every touch move event
- **After**: RAF-based throttling to sync with browser's refresh rate
- **Impact**: Reduces updates from 60+ FPS to display refresh rate (60 FPS max)

```typescript
const updateSwipeOffset = useCallback((offset: number, animate = false) => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
  
  animationFrameRef.current = requestAnimationFrame(() => {
    // Update DOM directly for better performance
    if (itemRef.current) {
      itemRef.current.style.setProperty('--swipe-offset', `${offset}px`);
    }
  });
}, []);
```

### 2. CSS Custom Properties for Transforms
- **Before**: Inline transform styles causing layout recalculations
- **After**: CSS custom properties with GPU-accelerated transforms
- **Impact**: Moves transforms to compositor layer, avoiding main thread

```css
.ios-list-item {
  --swipe-offset: 0px;
  transform: translateX(calc(-1 * var(--swipe-offset))) translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

### 3. Haptic Feedback Throttling
- **Before**: Synchronous haptic calls blocking main thread
- **After**: Throttled and asynchronous haptic feedback
- **Impact**: Prevents main thread blocking during touch interactions

```typescript
const triggerHapticThrottled = useCallback((type: 'light' | 'medium') => {
  const now = Date.now();
  if (now - lastHapticTrigger.current > 100) {
    lastHapticTrigger.current = now;
    setTimeout(() => impact(type), 0); // Async execution
  }
}, [impact]);
```

### 4. Hardware Acceleration Hints
- **Added**: `will-change`, `backface-visibility`, `translateZ(0)`
- **Impact**: Forces GPU acceleration for smoother animations

```css
.ios-list-item {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### 5. Reduced State Updates
- **Before**: Multiple state variables updated during swipe
- **After**: Refs for intermediate values, state only for final positions
- **Impact**: Fewer React re-renders during active swiping

```typescript
const currentOffset = useRef(0); // Intermediate values
const [swipeOffset, setSwipeOffset] = useState(0); // Final position only
```

### 6. Conditional Animation Classes
- **Added**: Dynamic CSS classes for different swipe states
- **Impact**: Optimized transitions only when needed

```typescript
// During active swiping - no transitions
itemRef.current.classList.add('swiping');

// During snap animation - smooth transitions
itemRef.current.classList.add('snapping');
```

### 7. Memoized Styles
- **Before**: Style objects recreated on every render
- **After**: `useMemo` for expensive style calculations
- **Impact**: Reduces object creation and comparison overhead

```typescript
const mainItemStyles = useMemo(() => ({
  // Expensive style calculations
}), [isDark, onClick, disabled, isPressed, divider, isAnimating]);
```

### 8. Event Handler Optimization
- **Added**: `useCallback` for all event handlers
- **Impact**: Prevents unnecessary re-renders of child components

## Performance Metrics

### Before Optimizations:
- Touch move events: 60+ FPS causing constant re-renders
- Haptic feedback: Synchronous, blocking main thread
- Transform updates: Inline styles causing layout thrashing
- Memory: New objects created on every render

### After Optimizations:
- Touch move events: RAF-throttled to display refresh rate
- Haptic feedback: Asynchronous, non-blocking
- Transform updates: GPU-accelerated via CSS custom properties
- Memory: Memoized objects, reduced garbage collection

## Browser Compatibility

### iOS Safari:
- ✅ Hardware acceleration via `-webkit-` prefixes
- ✅ Touch event optimization
- ✅ CSS custom properties support

### Chrome Mobile:
- ✅ Full support for all optimizations
- ✅ RAF and GPU acceleration

### Firefox Mobile:
- ✅ CSS custom properties and transforms
- ⚠️ Limited haptic feedback support

## Accessibility Considerations

```css
@media (prefers-reduced-motion: reduce) {
  .ios-list-item {
    transition: none !important;
    animation: none !important;
  }
}
```

## Testing Recommendations

1. **Performance Testing**: Use Chrome DevTools Performance tab to measure frame rates
2. **Memory Testing**: Monitor memory usage during extended swiping
3. **Device Testing**: Test on actual iOS devices with different performance levels
4. **Accessibility Testing**: Verify reduced motion preferences are respected

## Future Optimizations

1. **Web Workers**: Move complex calculations off main thread
2. **Intersection Observer**: Optimize rendering for off-screen items
3. **Virtual Scrolling**: For large lists with many swipeable items
4. **Touch Prediction**: Predict touch movement for even smoother interactions

## Monitoring

Monitor these metrics to ensure optimizations remain effective:
- Frame rate during swipe gestures (target: 60 FPS)
- Memory usage during extended use
- Touch event latency
- User-reported jitter or lag issues