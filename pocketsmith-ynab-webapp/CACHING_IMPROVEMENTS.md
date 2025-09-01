# Caching Improvements Summary

## Overview
This document outlines the caching improvements implemented to address the issue where "the page loads all the data every time it's opened."

## Problems Identified

### Before Improvements:
1. **Minimal React Query Configuration**: No default `staleTime` or `gcTime`, causing immediate refetches
2. **Inconsistent Caching Strategies**: Mix of React Query and custom caching logic
3. **Missing Development Tools**: No React Query DevTools for debugging
4. **Inefficient Cache Invalidation**: Broad invalidation patterns causing unnecessary refetches
5. **Page-Level Data Loading**: Every navigation triggered fresh API calls

## Improvements Implemented

### 1. Enhanced React Query Configuration ✅
**File**: `src/App.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: 'stale', // Only refetch if data is stale
      refetchOnReconnect: 'stale',
      refetchInterval: false, // Disable auto-refresh by default
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Benefits**:
- Data stays fresh for 5 minutes without refetching
- Cache persists for 10 minutes after last use
- Only refetches when data is actually stale
- Prevents unnecessary network requests on window focus/mount

### 2. React Query DevTools ✅
**Files**: `src/App.tsx`, `package.json`

- Installed `@tanstack/react-query-devtools`
- Added DevTools component for development debugging
- Enables real-time cache inspection and debugging

**Benefits**:
- Visual cache state monitoring
- Query performance debugging
- Cache invalidation tracking

### 3. Converted Balance Comparisons to React Query ✅
**Files**: 
- `src/hooks/useBalanceComparisonsQuery.ts` (new)
- `src/hooks/useDashboardData.ts` (updated)
- `src/pages/BalanceComparison.tsx` (updated)

**Before**: Custom hook with manual caching logic
**After**: Full React Query integration with:
- Consistent caching behavior (5-15 minute cache)
- Smart refresh mutations
- Proper error handling
- Cache age tracking

**Benefits**:
- Unified caching strategy across the app
- Better cache coordination between components
- Reduced API calls for balance data

### 4. Centralized Query Keys & Smart Cache Invalidation ✅
**Files**: 
- `src/hooks/queryKeys.ts` (new)
- `src/hooks/useAccountMappings.ts` (updated)
- `src/hooks/useBalanceComparisonsQuery.ts` (updated)
- `src/hooks/useDashboardData.ts` (updated)

**Features**:
- Hierarchical query key structure
- Smart invalidation patterns based on data relationships
- Centralized cache management helpers

**Before**: Broad invalidation (invalidate everything)
**After**: Targeted invalidation based on data dependencies

```typescript
// Smart invalidation after mapping changes
cacheInvalidation.afterMappingChange(queryClient);
// Only invalidates: mappings, accounts, balances, dashboard

// Smart invalidation after sync
cacheInvalidation.afterSync(queryClient);  
// Only invalidates: sync, balances, dashboard
```

## Cache Configuration Summary

| Data Type | Stale Time | Cache Time | Refresh Strategy |
|-----------|------------|------------|------------------|
| Accounts | 5 minutes | 10 minutes | On stale mount |
| Mappings | 2 minutes | 5 minutes | On stale mount |
| Balances | 5 minutes | 15 minutes | Manual/mutation |
| Sync State | 30 seconds | 2 minutes | 1-minute interval |
| Recent Activity | 2 minutes | 5 minutes | On stale mount |
| YNAB Budgets | 10 minutes | 30 minutes | On stale mount |

## Expected Performance Improvements

### Navigation Performance:
- **Before**: Every page visit = fresh API calls
- **After**: Cached data served for 2-10 minutes depending on data type

### Dashboard Loading:
- **Before**: 4-6 API calls on every visit
- **After**: Cached data served if fresh, selective refresh only

### Balance Comparisons:
- **Before**: Custom caching with potential inconsistencies
- **After**: React Query caching with 5-15 minute persistence

### Memory Usage:
- **Before**: No coordinated cache cleanup
- **After**: Automatic garbage collection after 2-30 minutes

## Development Benefits

1. **React Query DevTools**: Real-time cache inspection
2. **Centralized Query Keys**: Consistent cache management
3. **Smart Invalidation**: Reduced over-fetching
4. **Type Safety**: Full TypeScript support for query keys

## Testing the Improvements

### Manual Testing:
1. Open the app and navigate between pages
2. Check React Query DevTools (bottom-left icon in dev mode)
3. Observe cache hits vs network requests
4. Test refresh behaviors

### Expected Behavior:
- First visit: Network requests as expected
- Subsequent visits within cache time: Instant loading from cache
- Stale data: Background refresh while showing cached data
- Manual refresh: Immediate fresh data fetch

## Monitoring Cache Performance

Use React Query DevTools to monitor:
- Query status (fresh, stale, fetching)
- Cache hit rates
- Background refetch patterns
- Memory usage of cached data

## Future Enhancements

1. **Persistent Cache**: Consider adding persistence for offline support
2. **Optimistic Updates**: Implement for better UX during mutations
3. **Background Sync**: Add service worker integration
4. **Cache Warming**: Pre-fetch critical data on app start