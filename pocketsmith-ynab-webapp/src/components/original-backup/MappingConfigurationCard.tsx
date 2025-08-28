import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import type { YNABAccount, ExistingAccountMappingConfig } from '../types/accounts';

interface MappingConfigurationCardProps {
  config: ExistingAccountMappingConfig;
  ynabAccounts: YNABAccount[];
  onSave: (config: { default_account_id?: string; strict_mode: boolean }) => Promise<void>;
  isLoading?: boolean;
}

export const MappingConfigurationCard: React.FC<MappingConfigurationCardProps> = ({
  config,
  ynabAccounts,
  onSave,
  isLoading = false,
}) => {
  const [defaultAccountId, setDefaultAccountId] = useState<string>(config.default_account_id || '');
  const [strictMode, setStrictMode] = useState<boolean>(config.strict_mode);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update local state when config changes
  useEffect(() => {
    setDefaultAccountId(config.default_account_id || '');
    setStrictMode(config.strict_mode);
    setHasChanges(false);
  }, [config]);

  // Check for changes
  useEffect(() => {
    const configChanged = 
      defaultAccountId !== (config.default_account_id || '') ||
      strictMode !== config.strict_mode;
    setHasChanges(configChanged);
  }, [defaultAccountId, strictMode, config]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({
        default_account_id: defaultAccountId || undefined,
        strict_mode: strictMode,
      });
      setSuccess(true);
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDefaultAccountId(config.default_account_id || '');
    setStrictMode(config.strict_mode);
    setHasChanges(false);
    setError(null);
    setSuccess(false);
  };

  // Filter YNAB accounts to only show on-budget, non-closed accounts for default selection
  const availableDefaultAccounts = ynabAccounts.filter(account => 
    account.on_budget && !account.closed
  );

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            <Typography variant="h6">Mapping Configuration</Typography>
          </Box>
        }
        action={
          hasChanges && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              >
                Save
              </Button>
            </Box>
          )
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuration saved successfully!
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Default Account Selection */}
          <Box>
            <FormControl fullWidth>
              <InputLabel>Default YNAB Account</InputLabel>
              <Select
                value={defaultAccountId}
                onChange={(e) => setDefaultAccountId(e.target.value)}
                label="Default YNAB Account"
                disabled={isLoading || saving}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>No default account</em>
                </MenuItem>
                {availableDefaultAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {account.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.type} • On Budget
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              When strict mode is disabled, transactions from unmapped PocketSmith accounts will be assigned to this default YNAB account.
            </Typography>
          </Box>

          <Divider />

          {/* Strict Mode Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  disabled={isLoading || saving}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Strict Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strictMode 
                      ? 'Only sync transactions from explicitly mapped accounts'
                      : 'Allow transactions from unmapped accounts to use the default account'
                    }
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Configuration Summary */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Configuration:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Strict Mode:</strong> {strictMode ? 'Enabled' : 'Disabled'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Default Account:</strong> {
                defaultAccountId 
                  ? ynabAccounts.find(a => a.id === defaultAccountId)?.name || 'Unknown Account'
                  : 'None selected'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Mapped Accounts:</strong> {Object.keys(config.mappings || {}).length}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};