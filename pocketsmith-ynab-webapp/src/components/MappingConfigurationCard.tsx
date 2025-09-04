import React, { useState, useEffect } from 'react';
import {
  Card,
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
  Paper,
  Grid,
  Collapse,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,

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
  const theme = useTheme();
  const [defaultAccountId, setDefaultAccountId] = useState<string>(config.default_account_id || '');
  const [strictMode, setStrictMode] = useState<boolean>(config.strict_mode);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);



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

  const selectedAccount = ynabAccounts.find(a => a.id === defaultAccountId);

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            <SettingsIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sync Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control how account mapping behaves
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasChanges && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={handleReset}
                disabled={saving}
                sx={{ minWidth: 80 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                sx={{ minWidth: 100 }}
              >
                Save
              </Button>
            </>
          )}
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ pt: 0 }}>
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

        {/* Quick Status Overview */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: strictMode ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${strictMode ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Mode
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: strictMode ? 'error.main' : 'success.main' }}>
                {strictMode ? 'Strict' : 'Flexible'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Default Account
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                {selectedAccount ? selectedAccount.name.substring(0, 12) + (selectedAccount.name.length > 12 ? '...' : '') : 'None'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Mapped Accounts
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {Object.keys(config.mappings || {}).length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Detailed Configuration */}
        <Collapse in={expanded}>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Strict Mode Toggle */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                    disabled={isLoading || saving}
                    size="medium"
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
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
              
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: strictMode ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${strictMode ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.1)}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <InfoIcon
                  sx={{
                    fontSize: 16,
                    color: strictMode ? 'error.main' : 'success.main',
                    mt: 0.25,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {strictMode
                    ? 'Transactions from unmapped PocketSmith accounts will be rejected and logged as errors.'
                    : 'Transactions from unmapped accounts will be assigned to your default YNAB account if one is configured.'
                  }
                </Typography>
              </Box>
            </Box>

            {/* Default Account Selection */}
            {!strictMode && (
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
                  Transactions from unmapped PocketSmith accounts will be assigned to this account.
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};