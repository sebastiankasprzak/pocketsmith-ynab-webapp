# CLAUDE.md — PocketSmith-YNAB Sync WebApp

This file provides context and conventions for AI assistants working in this repository.

## Project Overview

A React/TypeScript web application that provides a management UI for synchronizing financial accounts between **PocketSmith** and **YNAB (You Need A Budget)**. Key features:

- Account mapping configuration between PocketSmith and YNAB accounts
- Real-time sync status monitoring and history
- Balance comparison with discrepancy detection
- Manual sync triggering
- AWS Cognito OAuth authentication
- Progressive Web App (PWA) with offline support
- iOS-native-like UX for mobile devices

## Repository Structure

This is an **npm workspaces** monorepo:

```
/
├── pocketsmith-ynab-webapp/   # Main React TypeScript webapp (Vite)
├── infrastructure/            # AWS CDK infrastructure as code
├── docs/                      # Feature documentation (19+ markdown files)
├── scripts/                   # Utility scripts for debugging/testing
├── package.json               # Root workspace config
└── deploy_wrapper.sh          # Main deployment script
```

### Webapp (`pocketsmith-ynab-webapp/`)

```
src/
├── pages/          # Route-level components
├── components/     # 80+ reusable UI components
├── hooks/          # 18 custom React hooks
├── services/       # API clients and service layer
├── contexts/       # React Context (AuthContext)
├── types/          # TypeScript type definitions
├── utils/          # Error handling, date utils, validation
├── theme/          # MUI theme configuration
└── styles/         # CSS (iOS-specific styles)
```

### Infrastructure (`infrastructure/`)

```
lib/
├── infrastructure-stack.ts    # Main CDK stack (S3, CloudFront, Cognito, API Gateway)
├── monitoring-stack.ts        # CloudWatch monitoring
└── sync-status-stack.ts       # Sync status infrastructure
lambda/
├── accounts/                  # Accounts API Lambda (AWS SDK v3)
├── balances/                  # Balance comparison Lambda (AWS SDK v3)
├── sync-monitoring/           # Sync monitoring Lambda (pending SDK v3 migration)
├── parameter-store/           # Parameter Store Lambda (AWS SDK v3)
└── shared/                    # Shared Lambda utilities
```

## Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript 5.8 |
| Build tool | Vite 7 |
| UI components | Material-UI (MUI) v7 |
| Server state | TanStack React Query v5 |
| Routing | React Router v7 |
| Auth | AWS Amplify v6 (Cognito) |
| HTTP client | Axios 1.11 |
| Date utilities | date-fns 4.1 |
| Unit testing | Vitest + React Testing Library |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Lambda testing | Jest |

## Development Commands

All commands run from the **repo root** unless noted.

```bash
# Install all dependencies (use --legacy-peer-deps)
npm run install:all

# Start development server at http://localhost:5173
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test                  # Webapp tests (watch mode)
npm run test:coverage         # Coverage report
npm run test:ci               # CI mode (verbose + coverage)
npm run test:integration      # Integration tests
npm run infra:test            # Lambda tests (Jest)

# Build
npm run build                 # Production build

# Clean
npm run clean                 # Remove all node_modules, dist, cdk.out
npm run fresh-install         # clean + install:all
```

### Direct webapp commands (from `pocketsmith-ynab-webapp/`)

```bash
npm run dev
npm run build
npm run test
npm run test:run              # Single test run (no watch)
npm run type-check
```

## Environment Variables

Create `pocketsmith-ynab-webapp/.env.local` for local development. All variables use the `VITE_` prefix.

```bash
# Required: AWS Cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_example
VITE_COGNITO_USER_POOL_CLIENT_ID=exampleclientid123
VITE_AWS_REGION=us-east-1

# Optional: API configuration
VITE_API_BASE_URL=/api                # Defaults to /api
VITE_USE_MOCK_API=true                # Use mock data (default in dev)
```

Reference: `pocketsmith-ynab-webapp/.env.example`

The app auto-selects mock vs real API based on environment. In development, `VITE_USE_MOCK_API=true` by default.

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Dashboard` | Main metrics and activity feed |
| `/accounts` | `AccountMappings` | Manage PS↔YNAB account mappings |
| `/sync` | `SyncStatus` | Sync monitoring and history |
| `/settings` | `BalanceComparison` | Compare balances across systems |
| `/ios-demo` | `IOSDemo` | iOS component showcase |

Legacy routes (`/account-mappings`, `/sync-status`, `/balance-comparison`) redirect to the above.

## Key Architecture Patterns

### API Client

The singleton `apiClient` (`src/services/apiClient.ts`) wraps Axios with:
- Automatic JWT auth header injection (Cognito ID token, not access token)
- Automatic token refresh on 401 with retry
- Standardized `ApiError` interface (`{ code, message, statusCode, timestamp?, details? }`)
- `auth:session-expired` CustomEvent dispatched when refresh fails

Always import and use the `apiClient` singleton; do not create raw Axios instances.

### React Query

React Query manages all server state. Global config (`App.tsx`):
- `staleTime`: 10 minutes
- `gcTime`: 30 minutes
- `retry`: 2 with exponential backoff
- `refetchOnWindowFocus`: false

**Query keys** use the factory in `src/hooks/queryKeys.ts`. Always use this factory — never hardcode query key strings:

```typescript
import { queryKeys, cacheInvalidation } from '../hooks/queryKeys';

// Use in useQuery
useQuery({ queryKey: queryKeys.mappingsData(), ... })

// Smart cache invalidation after mutations
cacheInvalidation.afterMappingChange(queryClient);
cacheInvalidation.afterSync(queryClient);
```

### iOS Experience

The app detects iOS devices via `useIOSDetection` and renders an iOS-native-like experience when `shouldUseIOSExperience && (deviceClass === 'phone' || deviceClass === 'tablet')`:
- `IOSLayout` replaces `Layout` + `Navigation`
- 40+ iOS-specific components prefixed with `iOS` (e.g., `IOSButton`, `IOSCard`, `IOSListItem`)
- Haptic feedback: `useHapticFeedback`
- Pull-to-refresh: `usePullToRefresh`
- Swipe gestures: `useSwipeGestures`
- iOS theming: `useStableIOSTheme` (prevents render loops — use this, not `useIOSTheme` directly)

### Authentication

Auth state is managed by `AuthContext` (`src/contexts/AuthContext.tsx`). All pages are wrapped in `ProtectedRoute`. The `AuthProvider` uses `authService` (`src/services/authService.ts`) which wraps AWS Amplify v6.

For auth errors, listen to the `auth:session-expired` CustomEvent or use `useAuthErrorHandler`.

### Error Handling

- `ErrorBoundary` component wraps pages and the full app (levels: `critical`, `page`)
- `errorLoggingService` for structured logging
- `ApiError` interface for standardized API errors
- `ToastProvider` for user-facing error notifications

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `AccountMappings.tsx` |
| iOS components | `iOS` prefix | `IOSButton.tsx` |
| Hooks | `use` prefix, camelCase | `useDashboardData.ts` |
| Services | camelCase | `apiClient.ts` |
| Types | camelCase | `accounts.ts` |
| Pages | PascalCase (named export) | `export const Dashboard = ...` |

Pages use **named exports**, not default exports:
```typescript
// Correct
export const Dashboard = () => { ... }

// Lazy imported in App.tsx as:
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
```

## Infrastructure & Deployment

### AWS Resources

- **S3** — static webapp hosting
- **CloudFront** — CDN with invalidation on deploy
- **Cognito** — OAuth user pools
- **API Gateway** — REST API with Cognito authorizer
- **Lambda** — 5 functions (accounts, balances, sync-monitoring, parameter-store, shared)
- **Parameter Store** — secrets and config
- **CloudWatch** — logs and monitoring

### Deployment

```bash
# Full deployment (validates AWS credentials, syncs S3, invalidates CloudFront)
npm run deploy staging
npm run deploy production

# Infrastructure only (CDK)
npm run infra:deploy
npm run infra:synth
npm run infra:diff

# Webapp only
./pocketsmith-ynab-webapp/deploy.sh
```

### Lambda AWS SDK Status

- accounts, balances, parameter-store, shared: **Migrated to AWS SDK v3**
- sync-monitoring: **Pending AWS SDK v3 migration**

When editing Lambda functions, use AWS SDK v3 (`@aws-sdk/client-*`) imports — do not add v2 dependencies.

## Testing

- Unit tests live in `src/**/__tests__/` directories
- Integration tests have a separate config: `vitest.integration.config.ts`
- Lambda tests use Jest in `infrastructure/lambda/*/test/`
- Coverage formats: HTML, JSON, text

When adding new hooks or services, add unit tests under a `__tests__` directory alongside the file.

## PWA Configuration

Configured via `vite-plugin-pwa` in `vite.config.ts`:
- Service worker: auto-update, NetworkFirst for API calls
- Manifest: standalone display, portrait orientation, finance category
- Shortcuts: Quick Sync (`/sync`), View Accounts (`/accounts`)
- `PWAInstallPrompt` and `PWAUpdatePrompt` components handle prompts

## Documentation

Feature-specific docs are in `docs/`. Key files:
- `docs/AUTHENTICATION_SETUP.md` — Cognito setup and troubleshooting
- `docs/ACCOUNT_MAPPING_*.md` — account mapping implementation
- `docs/BALANCE_COMPARISON_*.md` — balance comparison implementation
- `docs/IOS_*.md` — iOS optimizations and known fixes
- `docs/SYNC_STATUS_*.md` — sync status features

When implementing significant features, add a corresponding doc in `docs/`.

## Common Gotchas

1. **`npm install` requires `--legacy-peer-deps`** due to React 18/19 peer dependency conflicts. Use `npm run install:all` which handles this.
2. **iOS render loops**: Use `useStableIOSTheme` instead of raw `useIOSTheme` to avoid theme-triggered re-renders.
3. **API tokens**: Always use the **ID token** (not access token) for API Gateway Cognito authorizer.
4. **Query invalidation**: Use `cacheInvalidation.*` helpers from `queryKeys.ts` after mutations — they chain related invalidations correctly (e.g., mapping changes also invalidate balances and dashboard).
5. **Environment files**: `VITE_USE_MOCK_API=true` in staging by default. Set to `false` to hit real APIs.
6. **Page exports**: Pages use named exports and are lazy-loaded in `App.tsx` via `.then(m => ({ default: m.PageName }))`.
