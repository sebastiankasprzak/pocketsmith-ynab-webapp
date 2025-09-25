# Utility Scripts

This directory contains utility scripts for debugging, testing, and maintenance.

## API Testing & Debugging
- `debug-balance-api.js` - Debug script for balance comparison API in staging
- `test-api-endpoints.js` - Test all API endpoints for connectivity
- `test-auth-api.js` - Test authentication API endpoints
- `decode-jwt.js` - Utility to decode JWT tokens for debugging

## Maintenance Scripts
- `fix-balance-comparison.sh` - Automated fix for common balance comparison issues
- `test-sync-status-fix.html` - HTML test page for sync status functionality

## Usage Examples

### Test API Connectivity
```bash
node scripts/test-api-endpoints.js
```

### Debug Balance API
```bash
node scripts/debug-balance-api.js
```

### Decode JWT Token
```bash
node scripts/decode-jwt.js <your-jwt-token>
```

### Fix Balance Comparison Issues
```bash
chmod +x scripts/fix-balance-comparison.sh
./scripts/fix-balance-comparison.sh
```

## Note
These scripts are primarily for development and debugging purposes. Most production operations should use the main deployment and build scripts in the root directory.