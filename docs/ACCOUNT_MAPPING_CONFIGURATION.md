# Account Mapping Configuration

This document describes the new configuration functionality added to the Account Mappings page.

## Overview

The Account Mappings page now includes additional configuration options to control how the synchronization system handles unmapped accounts and transaction processing.

## New Features

### 1. Default Account Configuration

**Purpose**: Specify a default YNAB account to receive transactions from unmapped PocketSmith accounts when strict mode is disabled.

**Configuration**:
- Located in the "Mapping Configuration" card at the top of the Account Mappings page
- Dropdown selector showing only on-budget, non-closed YNAB accounts
- Can be set to "No default account" if desired

**Behavior**:
- When strict mode is disabled and a transaction comes from an unmapped PocketSmith account, it will be assigned to the configured default YNAB account
- If no default account is configured, unmapped transactions may be rejected or require manual intervention

### 2. Strict Mode Toggle

**Purpose**: Control whether the system only processes transactions from explicitly mapped accounts or allows unmapped accounts to use the default account.

**Configuration**:
- Toggle switch in the "Mapping Configuration" card
- Shows current state with descriptive text

**Behavior**:
- **Strict Mode Enabled (default)**: Only sync transactions from PocketSmith accounts that have explicit mappings to YNAB accounts
- **Strict Mode Disabled**: Allow transactions from unmapped PocketSmith accounts to be assigned to the default YNAB account

## Configuration Data Structure

The configuration is stored in AWS Parameter Store with the following structure:

```json
{
  "mappings": {
    "4031079": "6d7e0689-4e7e-4200-8243-1e4c4db6a23b",
    "4030110": "3c56c976-e44e-4b5d-bf49-dfab099b0ac7"
  },
  "default_account_id": "f49e571b-6dcd-4a18-87c9-9ea55de88c88",
  "strict_mode": true,
  "created_at": "2025-08-18T20:24:55.736395",
  "auto_generated": false
}
```

## API Endpoints

### Update Configuration
- **Endpoint**: `POST /mappings`
- **Purpose**: Update the mapping configuration including default account and strict mode
- **Payload**: Complete configuration object (preserves existing mappings)

### Fetch Configuration
- **Endpoint**: `GET /mappings`
- **Purpose**: Retrieve current mapping configuration
- **Response**: Includes mappings and configuration settings

## User Interface

### Configuration Card
- Appears at the top of the Account Mappings page
- Shows current configuration summary
- Provides controls for:
  - Default account selection
  - Strict mode toggle
  - Save/Reset buttons (appear when changes are made)

### Real-time Updates
- Changes are tracked in real-time
- Save button appears only when modifications are made
- Success/error messages provide feedback
- Configuration summary updates immediately after successful saves

## Implementation Details

### Frontend Components
- `MappingConfigurationCard`: Main configuration UI component
- `useUpdateMappingConfig`: React Query hook for API calls
- Integrated into existing `AccountMappings` page

### API Integration
- Uses existing `/mappings` endpoint with enhanced payload
- Preserves existing mappings when updating configuration
- Validates configuration before saving

### Mock API Support
- Full mock implementation for development/testing
- Persists configuration changes during session
- Matches real API behavior

## Testing

Comprehensive test coverage includes:
- Component rendering and interaction
- Configuration state management
- API integration (success/error scenarios)
- User workflow validation

## Usage Examples

### Example 1: Enable Flexible Mapping
1. Navigate to Account Mappings page
2. In the Configuration card, select a default YNAB account
3. Toggle "Strict Mode" to disabled
4. Click "Save"

Result: Transactions from unmapped PocketSmith accounts will be assigned to the selected default YNAB account.

### Example 2: Strict Account Control
1. Navigate to Account Mappings page
2. Ensure "Strict Mode" is enabled
3. Click "Save" if changes were made

Result: Only transactions from explicitly mapped PocketSmith accounts will be processed.

## Migration Notes

- Existing configurations are preserved
- Default strict mode is `true` (maintains current behavior)
- No default account is set initially (must be configured if strict mode is disabled)
- All existing mappings continue to work unchanged